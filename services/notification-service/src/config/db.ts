import { Client } from 'pg';
import { env } from './env.js';

// No Prisma models yet for this service — schema.prisma is still empty, so
// there's nothing to generate a client for. This just proves DB connectivity
// and ensures the schema exists; swap in PrismaClient once models land here.
let ready: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    const bootstrap = new Client({ connectionString: env.databaseUrl });
    await bootstrap.connect();
    await bootstrap.query(`CREATE SCHEMA IF NOT EXISTS "${env.dbSchema}"`);
    await bootstrap.end();
  })();
  return ready;
}

export async function disconnectDb(): Promise<void> {
  ready = null;
}
