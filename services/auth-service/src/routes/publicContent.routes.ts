import { Router } from 'express';
import { ah, validate } from '@ucc/service-kit';
import { submitTestimonialSchema, createContactSubmissionSchema } from '@ucc/types';
import { publicContentController } from '../controllers/publicContent.controller.js';

// Public marketing-site content — no auth. Mounted at /api/auth/public
// (covered by Kong's auth-public-content route, no jwt plugin).
export const publicContentRoutes = Router();

publicContentRoutes.get('/categories', ah(publicContentController.listCategories));
publicContentRoutes.get('/services', ah(publicContentController.listServices));
publicContentRoutes.get('/faqs', ah(publicContentController.listFaqs));
publicContentRoutes.get('/careers', ah(publicContentController.listCareers));
publicContentRoutes.get('/careers/:id', ah(publicContentController.getCareer));
publicContentRoutes.get('/locations', ah(publicContentController.listLocations));
publicContentRoutes.get('/testimonials', ah(publicContentController.listTestimonials));
publicContentRoutes.post('/testimonials', validate(submitTestimonialSchema), ah(publicContentController.submitTestimonial));
publicContentRoutes.post('/contact', validate(createContactSubmissionSchema), ah(publicContentController.submitContact));
