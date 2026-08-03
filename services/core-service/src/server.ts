import { createApp } from './app.js';
import { initDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function main() {
  await initDb();
  const server = createApp().listen(env.port, () => logger.info('core-service listening on http://localhost:' + env.port));
  const shutdown = async () => { server.close(); await disconnectDb(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
main().catch((e) => { logger.error(e, 'core-service failed to start'); process.exit(1); });
