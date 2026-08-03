import type { Request, Response } from 'express';
import { HttpError, ok, created } from '@ucc/service-kit';
import { patientService } from '../services/patient.service.js';
import { providerService } from '../services/provider.service.js';
import { bookingRepository } from '../repositories/booking.repository.js';

// Internal-only: reached via requireInternalSecret from auth-service during
// registration (self-service patient) or admin-created-user creation.
export const internalAdminController = {
  async createPatient(req: Request, res: Response) {
    // lastName is optional at registration (registerSchema) — many patients
    // have a single legal name — so only firstName is required here.
    const { userId, firstName } = req.body ?? {};
    if (!userId || !firstName) throw new HttpError(400, 'userId, firstName are required');
    created(res, await patientService.createWithProfile(req.body));
  },

  async createProvider(req: Request, res: Response) {
    const { userId, firstName, lastName } = req.body ?? {};
    if (!userId || !firstName || !lastName) throw new HttpError(400, 'userId, firstName, lastName are required');
    created(res, await providerService.create(req.body));
  },

  // Registration carryover — a guest's Stripe Customer id from their most
  // recent paid guest booking with this email, if any (see auth-service
  // auth.service.ts#register).
  async findGuestStripeCustomer(req: Request, res: Response) {
    const { email } = req.body as { email?: string };
    if (!email) throw new HttpError(400, 'email is required');
    const stripeCustomerId = await bookingRepository.latestGuestStripeCustomerId(email);
    ok(res, { stripeCustomerId });
  },
};
