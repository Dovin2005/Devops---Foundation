import { Router } from 'express';
import { ah, requirePermission } from '@ucc/service-kit';
import {
  createLocationSchema, updateLocationSchema, updateRoleConfigSchema, updateSettingsSchema, updateIntegrationCredentialsSchema, adminCreateUserSchema,
  createCategorySchema, updateCategorySchema,
  createServiceOfferingSchema, updateServiceOfferingSchema,
  createFaqSchema, updateFaqSchema,
  createCareerSchema, updateCareerSchema,
  updateContactSubmissionStatusSchema,
} from '@ucc/types';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.js';
import { validate } from '../middlewares/validate.js';

export const adminRoutes = Router();

// Every /api/admin endpoint requires a valid session; fine-grained access is
// then either the hard super_admin-only gate (existing endpoints, unchanged)
// or the RoleConfig-permission-matrix gate (new content endpoints below).
adminRoutes.use(authenticate);

// Locations (Multi-Clinic Management) — super_admin only
adminRoutes.get('/locations', requireSuperAdmin, ah(adminController.listLocations));
adminRoutes.post('/locations', requireSuperAdmin, validate(createLocationSchema), ah(adminController.createLocation));
adminRoutes.get('/locations/:id', requireSuperAdmin, ah(adminController.getLocation));
adminRoutes.put('/locations/:id', requireSuperAdmin, validate(updateLocationSchema), ah(adminController.updateLocation));
adminRoutes.delete('/locations/:id', requireSuperAdmin, ah(adminController.deleteLocation));

// Role configuration (the canonical eight — reconfigure only) — super_admin only
adminRoutes.get('/roles', requireSuperAdmin, ah(adminController.listRoles));
adminRoutes.put('/roles/:role', requireSuperAdmin, validate(updateRoleConfigSchema), ah(adminController.updateRole));

// Platform settings — super_admin only
adminRoutes.get('/settings', requireSuperAdmin, ah(adminController.getSettings));
adminRoutes.put('/settings', requireSuperAdmin, validate(updateSettingsSchema), ah(adminController.updateSettings));

// Integration credentials (third-party API settings) — super_admin only
adminRoutes.get('/integrations', requireSuperAdmin, ah(adminController.getIntegrations));
adminRoutes.put('/integrations', requireSuperAdmin, validate(updateIntegrationCredentialsSchema), ah(adminController.updateIntegrations));

// Audit logs — super_admin only
adminRoutes.get('/audit-logs', requireSuperAdmin, ah(adminController.listAuditLogs));

// Analytics — super_admin only
adminRoutes.get('/analytics/overview', requireSuperAdmin, ah(adminController.analyticsOverview));

// User creation (any of the eight canonical roles) — super_admin only
adminRoutes.post('/users', requireSuperAdmin, validate(adminCreateUserSchema), ah(adminController.createUser));

// ---- Content / CMS (public marketing site) — gated by the 'marketing'
// permission module instead of a hardcoded role, so marketing/office_manager
// can manage this content without being super_admin (see RoleConfig defaults).
const viewMarketing = requirePermission('marketing', 'view');
const createMarketing = requirePermission('marketing', 'create');
const editMarketing = requirePermission('marketing', 'edit');
const deleteMarketing = requirePermission('marketing', 'delete');

adminRoutes.get('/categories', viewMarketing, ah(adminController.listCategories));
adminRoutes.post('/categories', createMarketing, validate(createCategorySchema), ah(adminController.createCategory));
adminRoutes.get('/categories/:id', viewMarketing, ah(adminController.getCategory));
adminRoutes.put('/categories/:id', editMarketing, validate(updateCategorySchema), ah(adminController.updateCategory));
adminRoutes.delete('/categories/:id', deleteMarketing, ah(adminController.deleteCategory));

adminRoutes.get('/services', viewMarketing, ah(adminController.listServices));
adminRoutes.post('/services', createMarketing, validate(createServiceOfferingSchema), ah(adminController.createService));
adminRoutes.get('/services/:id', viewMarketing, ah(adminController.getService));
adminRoutes.put('/services/:id', editMarketing, validate(updateServiceOfferingSchema), ah(adminController.updateService));
adminRoutes.delete('/services/:id', deleteMarketing, ah(adminController.deleteService));

adminRoutes.get('/faqs', viewMarketing, ah(adminController.listFaqs));
adminRoutes.post('/faqs', createMarketing, validate(createFaqSchema), ah(adminController.createFaq));
adminRoutes.get('/faqs/:id', viewMarketing, ah(adminController.getFaq));
adminRoutes.put('/faqs/:id', editMarketing, validate(updateFaqSchema), ah(adminController.updateFaq));
adminRoutes.delete('/faqs/:id', deleteMarketing, ah(adminController.deleteFaq));

adminRoutes.get('/careers', viewMarketing, ah(adminController.listCareers));
adminRoutes.post('/careers', createMarketing, validate(createCareerSchema), ah(adminController.createCareer));
adminRoutes.get('/careers/:id', viewMarketing, ah(adminController.getCareer));
adminRoutes.put('/careers/:id', editMarketing, validate(updateCareerSchema), ah(adminController.updateCareer));
adminRoutes.delete('/careers/:id', deleteMarketing, ah(adminController.deleteCareer));

adminRoutes.get('/testimonials', viewMarketing, ah(adminController.listTestimonials));
adminRoutes.post('/testimonials/:id/approve', editMarketing, ah(adminController.approveTestimonial));
adminRoutes.post('/testimonials/:id/reject', editMarketing, ah(adminController.rejectTestimonial));
adminRoutes.delete('/testimonials/:id', deleteMarketing, ah(adminController.deleteTestimonial));

adminRoutes.get('/contact-submissions', viewMarketing, ah(adminController.listContactSubmissions));
adminRoutes.put('/contact-submissions/:id/status', editMarketing, validate(updateContactSubmissionStatusSchema), ah(adminController.updateContactSubmissionStatus));
adminRoutes.delete('/contact-submissions/:id', deleteMarketing, ah(adminController.deleteContactSubmission));
