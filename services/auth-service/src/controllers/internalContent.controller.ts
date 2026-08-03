import type { Request, Response } from 'express';
import { HttpError, actorFromHeaders, ok, okList, created, deleted } from '@ucc/service-kit';
import { categoryService } from '../services/category.service.js';
import { serviceOfferingService } from '../services/serviceOffering.service.js';
import { faqService } from '../services/faq.service.js';
import { careerService } from '../services/career.service.js';
import { testimonialService } from '../services/testimonial.service.js';
import { contactSubmissionService } from '../services/contactSubmission.service.js';

// Internal-only: reached via requireInternalSecret from superadmin-service,
// after its own authenticate + requirePermission gate. Not reachable via a
// user JWT. Same X-Actor-* header convention as internalAdmin.controller.ts.
function requireActor(req: Request) {
  const actor = actorFromHeaders(req);
  if (!actor) throw new HttpError(400, 'Missing X-Actor-* headers');
  return actor;
}

export const internalContentController = {
  // ---- Categories (doctor specialties) ----
  async listCategories(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await categoryService.list(status));
  },
  async getCategory(req: Request, res: Response) {
    ok(res, await categoryService.get(req.params.id!));
  },
  async createCategory(req: Request, res: Response) {
    created(res, await categoryService.create(req.body, requireActor(req)));
  },
  async updateCategory(req: Request, res: Response) {
    ok(res, await categoryService.update(req.params.id!, req.body, requireActor(req)));
  },
  async deleteCategory(req: Request, res: Response) {
    const hard = req.query.hard === 'true' || req.query.hard === '1';
    await categoryService.remove(req.params.id!, hard, requireActor(req));
    deleted(res);
  },

  // ---- Services catalog ----
  async listServices(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await serviceOfferingService.list(status));
  },
  async getService(req: Request, res: Response) {
    ok(res, await serviceOfferingService.get(req.params.id!));
  },
  async createService(req: Request, res: Response) {
    created(res, await serviceOfferingService.create(req.body, requireActor(req)));
  },
  async updateService(req: Request, res: Response) {
    ok(res, await serviceOfferingService.update(req.params.id!, req.body, requireActor(req)));
  },
  async deleteService(req: Request, res: Response) {
    await serviceOfferingService.remove(req.params.id!, requireActor(req));
    deleted(res);
  },

  // ---- FAQs ----
  async listFaqs(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await faqService.list(status));
  },
  async getFaq(req: Request, res: Response) {
    ok(res, await faqService.get(req.params.id!));
  },
  async createFaq(req: Request, res: Response) {
    created(res, await faqService.create(req.body, requireActor(req)));
  },
  async updateFaq(req: Request, res: Response) {
    ok(res, await faqService.update(req.params.id!, req.body, requireActor(req)));
  },
  async deleteFaq(req: Request, res: Response) {
    await faqService.remove(req.params.id!, requireActor(req));
    deleted(res);
  },

  // ---- Careers ----
  async listCareers(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await careerService.list(status));
  },
  async getCareer(req: Request, res: Response) {
    ok(res, await careerService.get(req.params.id!));
  },
  async createCareer(req: Request, res: Response) {
    created(res, await careerService.create(req.body, requireActor(req)));
  },
  async updateCareer(req: Request, res: Response) {
    ok(res, await careerService.update(req.params.id!, req.body, requireActor(req)));
  },
  async deleteCareer(req: Request, res: Response) {
    await careerService.remove(req.params.id!, requireActor(req));
    deleted(res);
  },

  // ---- Testimonials (moderation) ----
  async listTestimonials(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await testimonialService.list(status));
  },
  async approveTestimonial(req: Request, res: Response) {
    ok(res, await testimonialService.approve(req.params.id!, requireActor(req)));
  },
  async rejectTestimonial(req: Request, res: Response) {
    ok(res, await testimonialService.reject(req.params.id!, requireActor(req)));
  },
  async deleteTestimonial(req: Request, res: Response) {
    await testimonialService.remove(req.params.id!, requireActor(req));
    deleted(res);
  },

  // ---- Contact submissions ----
  async listContactSubmissions(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await contactSubmissionService.list(status));
  },
  async updateContactSubmissionStatus(req: Request, res: Response) {
    ok(res, await contactSubmissionService.markStatus(req.params.id!, req.body.status, requireActor(req)));
  },
  async deleteContactSubmission(req: Request, res: Response) {
    await contactSubmissionService.remove(req.params.id!, requireActor(req));
    deleted(res);
  },
};
