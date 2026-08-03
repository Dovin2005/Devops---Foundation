import { Router } from 'express';
import { ah, requireInternalSecret } from '@ucc/service-kit';
import { createLocationSchema, updateLocationSchema, updateRoleConfigSchema, updateSettingsSchema, updateIntegrationCredentialsSchema, adminCreateUserSchema } from '@ucc/types';
import { internalAdminController } from '../controllers/internalAdmin.controller.js';
import { validate } from '../middlewares/validate.js';
import { env } from '../config/env.js';

export const internalAdminRoutes = Router();

// Service-to-service only — superadmin-service proxies here after its own
// authenticate + requireSuperAdmin gate. Not reachable via a user JWT.
internalAdminRoutes.use(requireInternalSecret(env.internalSecret));

// Locations (Multi-Clinic Management)
internalAdminRoutes.get('/locations', ah(internalAdminController.listLocations));
internalAdminRoutes.post('/locations', validate(createLocationSchema), ah(internalAdminController.createLocation));
internalAdminRoutes.get('/locations/:id', ah(internalAdminController.getLocation));
internalAdminRoutes.put('/locations/:id', validate(updateLocationSchema), ah(internalAdminController.updateLocation));
internalAdminRoutes.delete('/locations/:id', ah(internalAdminController.deleteLocation));

// Role configuration (the canonical eight — reconfigure only)
internalAdminRoutes.get('/roles', ah(internalAdminController.listRoles));
internalAdminRoutes.put('/roles/:role', validate(updateRoleConfigSchema), ah(internalAdminController.updateRole));

// Platform settings
internalAdminRoutes.get('/settings', ah(internalAdminController.getSettings));
internalAdminRoutes.put('/settings', validate(updateSettingsSchema), ah(internalAdminController.updateSettings));

// Integration credentials (third-party API settings — Stripe/Twilio/SendGrid/...)
internalAdminRoutes.get('/integrations', ah(internalAdminController.getIntegrations));
internalAdminRoutes.put('/integrations', validate(updateIntegrationCredentialsSchema), ah(internalAdminController.updateIntegrations));
// Decrypted — called directly by notification-service/billing-service, not via superadmin-service.
internalAdminRoutes.get('/integrations/:provider/secrets', ah(internalAdminController.getIntegrationSecrets));

// Audit logs
internalAdminRoutes.get('/audit-logs', ah(internalAdminController.listAuditLogs));

// Analytics
internalAdminRoutes.get('/analytics-overview', ah(internalAdminController.analyticsOverview));

// User creation (any of the eight canonical roles — staff can't self-register)
internalAdminRoutes.post('/users', validate(adminCreateUserSchema), ah(internalAdminController.createUser));
