import { Router } from 'express';
import { z } from 'zod';
import { ah, requireInternalSecret, validate, created, ok } from '@ucc/service-kit';
import { env } from '../config/env.js';
import { bookingPaymentsService } from '../services/bookingPayments.service.js';

// core-service → billing-service booking payments (not exposed through Kong).
// Guests have no JWT, so the booking payment call is authenticated service-to-
// service with the shared internal secret instead.

const preauthSchema = z.object({
  bookingId: z.string().uuid(),
  patientId: z.string().uuid().nullish(),
  userId: z.string().uuid().nullish(),
  amountUsd: z.number().positive(),
  currency: z.enum(['usd', 'cop']).default('usd'),
  paymentMethodId: z.string().optional(),
  savePaymentMethod: z.boolean().optional(),
  customerEmail: z.string().email().nullish(),
  guestStripeCustomerId: z.string().nullish(),
  description: z.string().max(200).optional(),
});

const bookingRefSchema = z.object({ bookingId: z.string().uuid() });

export const internalBookingsRoutes = Router();
internalBookingsRoutes.use(requireInternalSecret(env.internalSecret));

internalBookingsRoutes.post('/preauth', validate(preauthSchema), ah(async (req, res) => {
  created(res, await bookingPaymentsService.preauthorize(req.body));
}));
internalBookingsRoutes.post('/capture', validate(bookingRefSchema), ah(async (req, res) => {
  ok(res, await bookingPaymentsService.capture(req.body.bookingId));
}));
internalBookingsRoutes.post('/cancel', validate(bookingRefSchema), ah(async (req, res) => {
  ok(res, await bookingPaymentsService.cancel(req.body.bookingId));
}));
