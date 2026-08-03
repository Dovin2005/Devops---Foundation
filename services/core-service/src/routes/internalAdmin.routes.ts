import { Router } from 'express';
import { ah, requireInternalSecret } from '@ucc/service-kit';
import { internalAdminController } from '../controllers/internalAdmin.controller.js';
import { env } from '../config/env.js';

export const internalAdminRoutes = Router();

// Service-to-service only — auth-service calls this during registration
// (patient) or admin-created-user creation (patient/physician). Not
// reachable via a user JWT, not Kong-routed.
internalAdminRoutes.use(requireInternalSecret(env.internalSecret));

internalAdminRoutes.post('/patients', ah(internalAdminController.createPatient));
internalAdminRoutes.post('/providers', ah(internalAdminController.createProvider));
internalAdminRoutes.post('/bookings/guest-stripe-customer', ah(internalAdminController.findGuestStripeCustomer));
