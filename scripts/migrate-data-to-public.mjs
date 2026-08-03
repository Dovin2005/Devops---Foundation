// One-time data move for the single-schema consolidation: copies every row from
// the old per-service Postgres schemas (auth, core, clinical, billing, comms, …)
// into the same-named table in **public**. Idempotent (ON CONFLICT DO NOTHING);
// the old schemas are left untouched so this is safe to re-run and easy to roll
// back — drop them manually once you're happy with public.
//
// Usage:  node scripts/migrate-data-to-public.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Client } = require('pg');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envFile = fs.readFileSync(path.join(root, 'apigateway-service', '.env'), 'utf8');
  const base = envFile.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
  if (!base) throw new Error('DATABASE_URL not set and not found in apigateway-service/.env');
  return base;
}

const OLD_SCHEMAS = ['auth', 'core', 'clinical', 'billing', 'commerce', 'marketing', 'comms', 'superadmin'];

const client = new Client({ connectionString: resolveDatabaseUrl(), ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows } = await client.query(
  `select table_schema, table_name from information_schema.tables
   where table_schema = any($1) and table_name <> '_prisma_migrations'
   order by table_schema, table_name`,
  [OLD_SCHEMAS],
);

for (const { table_schema: s, table_name: t } of rows) {
  const target = await client.query(
    `select 1 from information_schema.tables where table_schema='public' and table_name=$1`,
    [t],
  );
  if (!target.rowCount) {
    console.log(`skip  ${s}.${t} — no public.${t} (table not in any current Prisma schema)`);
    continue;
  }
  // Copy only the columns both sides share — public tables may have gained columns.
  const { rows: common } = await client.query(
    `select a.column_name from information_schema.columns a
     join information_schema.columns b on b.table_schema='public' and b.table_name=a.table_name and b.column_name=a.column_name
     where a.table_schema=$1 and a.table_name=$2 order by a.ordinal_position`,
    [s, t],
  );
  const cols = common.map((c) => `"${c.column_name}"`).join(', ');
  const res = await client.query(
    `insert into public."${t}" (${cols}) select ${cols} from "${s}"."${t}" on conflict do nothing`,
  );
  console.log(`copy  ${s}.${t} -> public.${t}: ${res.rowCount} rows`);
}

await client.end();
