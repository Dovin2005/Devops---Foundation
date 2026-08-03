import type { Invoice } from '../generated/prisma/index.js';

// Re-export the Prisma-generated model type so the rest of the service
// (repositories/services/controllers) keeps importing `Invoice` from here.
export type { Invoice };

export interface InvoiceLine {
  label: string;
  qty: number;
  unitPriceCop: number;
  totalCop: number;
}
