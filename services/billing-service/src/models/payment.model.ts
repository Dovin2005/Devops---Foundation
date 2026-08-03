import type { Payment } from '../generated/prisma/index.js';

// Re-export the Prisma-generated model type so the rest of the service
// (repositories/services/controllers) keeps importing `Payment` from here.
export type { Payment };
