// Single source of truth for DATABASE_URL: apigateway-service/.env.
// Falls back to an already-set DATABASE_URL (e.g. docker-compose sets it directly
// via its own env_file + environment mapping).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envFile = fs.readFileSync(path.join(root, 'apigateway-service', '.env'), 'utf8');
  const get = (k) => envFile.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim() ?? '';
  const base = get('DATABASE_URL');
  if (!base) throw new Error('DATABASE_URL not set and not found in apigateway-service/.env');
  const extra = get('DATABASE_URL_EXTRA'); // e.g. "&sslmode=require"
  return `${base}?schema=public${extra}`;
}
