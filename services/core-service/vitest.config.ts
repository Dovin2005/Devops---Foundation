import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Serialize test files: they share one Postgres schema; parallel synchronize
    // would race on DDL. (Each service owns its schema, so cross-service is fine.)
    fileParallelism: false,
  },
});
