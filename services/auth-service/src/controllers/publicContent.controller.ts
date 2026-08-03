import type { Request, Response } from 'express';
import { okList, ok, created } from '@ucc/service-kit';
import { categoryService } from '../services/category.service.js';
import { serviceOfferingService } from '../services/serviceOffering.service.js';
import { faqService } from '../services/faq.service.js';
import { careerService } from '../services/career.service.js';
import { testimonialService } from '../services/testimonial.service.js';
import { contactSubmissionService } from '../services/contactSubmission.service.js';
import { locationService } from '../services/location.service.js';

// Public marketing-site content. No auth — same convention as core-service's
// providers.routes.ts (public directory, zero auth middleware).
export const publicContentController = {
  async listCategories(_req: Request, res: Response) {
    okList(res, await categoryService.list('active'));
  },
  async listServices(_req: Request, res: Response) {
    okList(res, await serviceOfferingService.list('active'));
  },
  async listFaqs(_req: Request, res: Response) {
    okList(res, await faqService.list('published'));
  },
  async listCareers(_req: Request, res: Response) {
    okList(res, await careerService.list('open'));
  },
  async getCareer(req: Request, res: Response) {
    ok(res, await careerService.get(req.params.id!));
  },
  async listLocations(_req: Request, res: Response) {
    okList(res, await locationService.listPublic('active'));
  },
  async listTestimonials(_req: Request, res: Response) {
    okList(res, await testimonialService.list('approved'));
  },
  async submitTestimonial(req: Request, res: Response) {
    created(res, await testimonialService.submit(req.body));
  },
  async submitContact(req: Request, res: Response) {
    created(res, await contactSubmissionService.submit(req.body));
  },
};
