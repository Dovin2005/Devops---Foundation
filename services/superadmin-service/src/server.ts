import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

function main() {
  const server = createApp().listen(env.port, () => logger.info('superadmin-service listening on http://localhost:' + env.port));
  const shutdown = () => { server.close(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
main();
