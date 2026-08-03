import { Client } from 'pg';
import { PrismaClient } from '../generated/prisma/index.js';
import { env } from './env.js';

// Single pooled Prisma client, initialized once at boot (never per request).
export const prisma = new PrismaClient({ log: [] });

let ready: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    // Prisma won't create the Postgres schema itself — ensure it exists first,
    // same as the previous TypeORM bootstrap step.
    const bootstrap = new Client({ connectionString: env.databaseUrl });
    await bootstrap.connect();
    await bootstrap.query(`CREATE SCHEMA IF NOT EXISTS "${env.dbSchema}"`);
    await bootstrap.end();
    await prisma.$connect();
  })();
  return ready;
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
  ready = null;
}
