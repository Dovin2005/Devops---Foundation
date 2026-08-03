import { Router } from 'express';
import { ah, requireInternalSecret, validate } from '@ucc/service-kit';
import {
  createCategorySchema, updateCategorySchema,
  createServiceOfferingSchema, updateServiceOfferingSchema,
  createFaqSchema, updateFaqSchema,
  createCareerSchema, updateCareerSchema,
  updateContactSubmissionStatusSchema,
} from '@ucc/types';
import { internalContentController } from '../controllers/internalContent.controller.js';
import { env } from '../config/env.js';

// Service-to-service only — superadmin-service proxies here after its own
// authenticate + requirePermission('marketing', ...) gate. Not reachable via
// a user JWT, not Kong-routed.
export const internalContentRoutes = Router();
internalContentRoutes.use(requireInternalSecret(env.internalSecret));

// Categories (doctor specialties)
internalContentRoutes.get('/categories', ah(internalContentController.listCategories));
internalContentRoutes.post('/categories', validate(createCategorySchema), ah(internalContentController.createCategory));
internalContentRoutes.get('/categories/:id', ah(internalContentController.getCategory));
internalContentRoutes.put('/categories/:id', validate(updateCategorySchema), ah(internalContentController.updateCategory));
internalContentRoutes.delete('/categories/:id', ah(internalContentController.deleteCategory));

// Services catalog
internalContentRoutes.get('/services', ah(internalContentController.listServices));
internalContentRoutes.post('/services', validate(createServiceOfferingSchema), ah(internalContentController.createService));
internalContentRoutes.get('/services/:id', ah(internalContentController.getService));
internalContentRoutes.put('/services/:id', validate(updateServiceOfferingSchema), ah(internalContentController.updateService));
internalContentRoutes.delete('/services/:id', ah(internalContentController.deleteService));

// FAQs
internalContentRoutes.get('/faqs', ah(internalContentController.listFaqs));
internalContentRoutes.post('/faqs', validate(createFaqSchema), ah(internalContentController.createFaq));
internalContentRoutes.get('/faqs/:id', ah(internalContentController.getFaq));
internalContentRoutes.put('/faqs/:id', validate(updateFaqSchema), ah(internalContentController.updateFaq));
internalContentRoutes.delete('/faqs/:id', ah(internalContentController.deleteFaq));

// Careers
internalContentRoutes.get('/careers', ah(internalContentController.listCareers));
internalContentRoutes.post('/careers', validate(createCareerSchema), ah(internalContentController.createCareer));
internalContentRoutes.get('/careers/:id', ah(internalContentController.getCareer));
internalContentRoutes.put('/careers/:id', validate(updateCareerSchema), ah(internalContentController.updateCareer));
internalContentRoutes.delete('/careers/:id', ah(internalContentController.deleteCareer));

// Testimonials (moderation — no create; that's the public submit endpoint)
internalContentRoutes.get('/testimonials', ah(internalContentController.listTestimonials));
internalContentRoutes.post('/testimonials/:id/approve', ah(internalContentController.approveTestimonial));
internalContentRoutes.post('/testimonials/:id/reject', ah(internalContentController.rejectTestimonial));
internalContentRoutes.delete('/testimonials/:id', ah(internalContentController.deleteTestimonial));

// Contact submissions (no create; that's the public submit endpoint)
internalContentRoutes.get('/contact-submissions', ah(internalContentController.listContactSubmissions));
internalContentRoutes.put('/contact-submissions/:id/status', validate(updateContactSubmissionStatusSchema), ah(internalContentController.updateContactSubmissionStatus));
internalContentRoutes.delete('/contact-submissions/:id', ah(internalContentController.deleteContactSubmission));
