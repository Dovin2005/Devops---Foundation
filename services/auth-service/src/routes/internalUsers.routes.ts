import { Router } from 'express';
import { z } from 'zod';
import { ah, requireInternalSecret, validate } from '@ucc/service-kit';
import { env } from '../config/env.js';
import { internalUsersController } from '../controllers/internalUsers.controller.js';

// billing-service → auth-service: resolve/persist a user's Stripe Customer id.
// Not exposed through Kong — shared-secret service-to-service auth only.
export const internalUsersRoutes = Router();
internalUsersRoutes.use(requireInternalSecret(env.internalSecret));

const setStripeCustomerSchema = z.object({ stripeCustomerId: z.string().min(1) });

internalUsersRoutes.get('/:id/stripe-customer', ah(internalUsersController.getStripeCustomer));
internalUsersRoutes.put('/:id/stripe-customer', validate(setStripeCustomerSchema), ah(internalUsersController.setStripeCustomer));
