import { createApp } from './app.js';
import { initDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function main() {
  await initDb(); // pool initialized once, before serving
  const server = createApp().listen(env.port, () => {
    logger.info(`auth-service listening on http://localhost:${env.port} (mounts /api/auth)`);
  });
  const shutdown = async () => {
    server.close();
    const { disconnectDb } = await import('./config/db.js');
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => { logger.error(e, 'auth-service failed to start'); process.exit(1); });
