import { Client } from 'pg';
import { PrismaClient } from '../generated/prisma/index.js';
import { env } from './env.js';

// Single pooled Prisma client, initialized once at boot (never per request).
export const prisma = new PrismaClient({ log: [] });

let ready: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (ready) return ready;

  ready = (async () => {
    console.log('========== DB INITIALIZATION START ==========');

    console.log('Step 1: Creating PostgreSQL bootstrap client...');
    const bootstrap = new Client({
      connectionString: env.databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    console.log('Step 2: Connecting to PostgreSQL...');
    await bootstrap.connect();
    console.log('✅ Step 2 Complete: PostgreSQL connected');

    console.log(`Step 3: Creating schema "${env.dbSchema}" if it does not exist...`);
    await bootstrap.query(`CREATE SCHEMA IF NOT EXISTS "${env.dbSchema}"`);
    console.log('✅ Step 3 Complete: Schema verified');

    console.log('Step 4: Closing bootstrap connection...');
    await bootstrap.end();
    console.log('✅ Step 4 Complete: Bootstrap connection closed');

    console.log('Step 5: Connecting Prisma...');
    await prisma.$connect();
    console.log('✅ Step 5 Complete: Prisma connected');

    console.log('========== DB INITIALIZATION SUCCESS ==========');
  })().catch(async (err) => {
    console.error('========== DB INITIALIZATION FAILED ==========');
    console.error(err);
    throw err;
  });

  return ready;
}

export async function disconnectDb(): Promise<void> {
  console.log('Disconnecting Prisma...');
  await prisma.$disconnect();
  ready = null;
}
