// Runs a command with DATABASE_URL injected from apigateway-service/.env, so
// no individual service needs its own local .env for Prisma or `dev`/`start`.
//
// Usage: node ../../scripts/with-db-env.mjs <command> [args...]
import { execSync } from 'node:child_process';
import { resolveDatabaseUrl } from './lib/resolveDatabaseUrl.mjs';

const cmd = process.argv.slice(2).join(' ');
if (!cmd) {
  console.error('Usage: node scripts/with-db-env.mjs <command> [args...]');
  process.exit(1);
}

try {
  execSync(cmd, {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: resolveDatabaseUrl() },
  });
} catch (err) {
  process.exit(err.status ?? 1);
}
