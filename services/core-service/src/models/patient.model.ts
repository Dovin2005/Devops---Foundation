import type { Patient } from '../generated/prisma/index.js';

// Re-export the Prisma-generated model type so the rest of the service
// (repositories/services/controllers) keeps importing `Patient` from here.
export type { Patient };

export interface Address {
  department?: string;
  city?: string;
  line1?: string;
  neighbourhood?: string;
  country?: string;
  lat?: number;
  lng?: number;
}
export interface MarketingConsent {
  email?: boolean;
  whatsapp?: boolean;
  sms?: boolean;
}
export interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}
