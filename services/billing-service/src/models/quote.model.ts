import type { Quote } from '../generated/prisma/index.js';

// Re-export the Prisma-generated model type so the rest of the service
// (repositories/services/controllers) keeps importing `Quote` from here.
export type { Quote };

export interface QuoteLine {
  label: string;
  catalogPriceUsd: number;
  markupPct: number;
  totalUsd: number;
}
