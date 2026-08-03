import type { Booking } from '../generated/prisma/index.js';

// Re-export the Prisma-generated model type so the rest of the service
// (repositories/services/controllers) keeps importing `Booking` from here.
export type { Booking };

export interface BookingPerson {
  firstName: string;
  lastName: string;
  dob?: string;
  idType?: string;
  idNumber?: string;
}
