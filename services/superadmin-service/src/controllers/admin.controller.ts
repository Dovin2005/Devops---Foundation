import type { Request, Response } from 'express';
import { actorFrom, ok, okList, okPage, created, deleted } from '@ucc/service-kit';
import type { IntegrationProvider, ContactSubmissionStatus } from '@ucc/types';
import { locationService } from '../services/location.service.js';
import { roleService } from '../services/role.service.js';
import { settingService } from '../services/setting.service.js';
import { integrationCredentialService } from '../services/integrationCredential.service.js';
import { auditService } from '../services/audit.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { userService } from '../services/user.service.js';
import {
  categoryService, serviceOfferingService, faqService, careerService, testimonialService, contactSubmissionService,
} from '../services/content.service.js';

// Controllers are thin: parse request → call service → shape response.
// req.user is guaranteed by authenticate + requireSuperAdmin upstream.
// requestId middleware stamps req.id (typed via cast, same as service-kit).
const rid = (req: Request) => (req as Request & { id?: string }).id;

export const adminController = {
  // ---- Locations (Multi-Clinic Management) ----
  async listLocations(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await locationService.list(status));
  },

  async getLocation(req: Request, res: Response) {
    ok(res, await locationService.get(req.params.id!));
  },

  async createLocation(req: Request, res: Response) {
    created(res, await locationService.create(req.body, actorFrom(req.user!, rid(req))));
  },

  async updateLocation(req: Request, res: Response) {
    ok(res, await locationService.update(req.params.id!, req.body, actorFrom(req.user!, rid(req))));
  },

  async deleteLocation(req: Request, res: Response) {
    const hard = req.query.hard === 'true' || req.query.hard === '1';
    await locationService.remove(req.params.id!, hard, actorFrom(req.user!, rid(req)));
    deleted(res);
  },

  // ---- Role configuration ----
  async listRoles(_req: Request, res: Response) {
    okList(res, await roleService.list());
  },

  async updateRole(req: Request, res: Response) {
    ok(res, await roleService.update(req.params.role!, req.body, actorFrom(req.user!, rid(req))));
  },

  // ---- Platform settings ----
  async getSettings(_req: Request, res: Response) {
    ok(res, await settingService.getAll());
  },

  async updateSettings(req: Request, res: Response) {
    ok(res, await settingService.updateMany(req.body.settings, actorFrom(req.user!, rid(req))));
  },

  // ---- Integration credentials (third-party API settings) ----
  async getIntegrations(req: Request, res: Response) {
    const provider = req.query.provider ? String(req.query.provider) : undefined;
    ok(res, await integrationCredentialService.getAll(provider));
  },

  async updateIntegrations(req: Request, res: Response) {
    const { provider, values } = req.body as { provider: IntegrationProvider; values: Record<string, string> };
    ok(res, await integrationCredentialService.updateMany(provider, values, actorFrom(req.user!, rid(req))));
  },

  // ---- Audit logs (query params clamped/parsed by auth-service, forwarded verbatim) ----
  async listAuditLogs(req: Request, res: Response) {
    const { logs, total, page, pageSize } = await auditService.search(req.query as Record<string, string>);
    okPage(res, logs, { page, pageSize, totalCount: total });
  },

  // ---- Analytics ----
  async analyticsOverview(_req: Request, res: Response) {
    ok(res, await analyticsService.overview());
  },

  // ---- User creation (any of the eight canonical roles) ----
  async createUser(req: Request, res: Response) {
    created(res, await userService.create(req.body, actorFrom(req.user!, rid(req))));
  },

  // ---- Content / CMS (public marketing site) ----
  async listCategories(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await categoryService.list(status));
  },
  async getCategory(req: Request, res: Response) {
    ok(res, await categoryService.get(req.params.id!));
  },
  async createCategory(req: Request, res: Response) {
    created(res, await categoryService.create(req.body, actorFrom(req.user!, rid(req))));
  },
  async updateCategory(req: Request, res: Response) {
    ok(res, await categoryService.update(req.params.id!, req.body, actorFrom(req.user!, rid(req))));
  },
  async deleteCategory(req: Request, res: Response) {
    const hard = req.query.hard === 'true' || req.query.hard === '1';
    await categoryService.remove(req.params.id!, hard, actorFrom(req.user!, rid(req)));
    deleted(res);
  },

  async listServices(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await serviceOfferingService.list(status));
  },
  async getService(req: Request, res: Response) {
    ok(res, await serviceOfferingService.get(req.params.id!));
  },
  async createService(req: Request, res: Response) {
    created(res, await serviceOfferingService.create(req.body, actorFrom(req.user!, rid(req))));
  },
  async updateService(req: Request, res: Response) {
    ok(res, await serviceOfferingService.update(req.params.id!, req.body, actorFrom(req.user!, rid(req))));
  },
  async deleteService(req: Request, res: Response) {
    await serviceOfferingService.remove(req.params.id!, actorFrom(req.user!, rid(req)));
    deleted(res);
  },

  async listFaqs(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await faqService.list(status));
  },
  async getFaq(req: Request, res: Response) {
    ok(res, await faqService.get(req.params.id!));
  },
  async createFaq(req: Request, res: Response) {
    created(res, await faqService.create(req.body, actorFrom(req.user!, rid(req))));
  },
  async updateFaq(req: Request, res: Response) {
    ok(res, await faqService.update(req.params.id!, req.body, actorFrom(req.user!, rid(req))));
  },
  async deleteFaq(req: Request, res: Response) {
    await faqService.remove(req.params.id!, actorFrom(req.user!, rid(req)));
    deleted(res);
  },

  async listCareers(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await careerService.list(status));
  },
  async getCareer(req: Request, res: Response) {
    ok(res, await careerService.get(req.params.id!));
  },
  async createCareer(req: Request, res: Response) {
    created(res, await careerService.create(req.body, actorFrom(req.user!, rid(req))));
  },
  async updateCareer(req: Request, res: Response) {
    ok(res, await careerService.update(req.params.id!, req.body, actorFrom(req.user!, rid(req))));
  },
  async deleteCareer(req: Request, res: Response) {
    await careerService.remove(req.params.id!, actorFrom(req.user!, rid(req)));
    deleted(res);
  },

  async listTestimonials(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await testimonialService.list(status));
  },
  async approveTestimonial(req: Request, res: Response) {
    ok(res, await testimonialService.approve(req.params.id!, actorFrom(req.user!, rid(req))));
  },
  async rejectTestimonial(req: Request, res: Response) {
    ok(res, await testimonialService.reject(req.params.id!, actorFrom(req.user!, rid(req))));
  },
  async deleteTestimonial(req: Request, res: Response) {
    await testimonialService.remove(req.params.id!, actorFrom(req.user!, rid(req)));
    deleted(res);
  },

  async listContactSubmissions(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await contactSubmissionService.list(status));
  },
  async updateContactSubmissionStatus(req: Request, res: Response) {
    const { status } = req.body as { status: ContactSubmissionStatus };
    ok(res, await contactSubmissionService.updateStatus(req.params.id!, status, actorFrom(req.user!, rid(req))));
  },
  async deleteContactSubmission(req: Request, res: Response) {
    await contactSubmissionService.remove(req.params.id!, actorFrom(req.user!, rid(req)));
    deleted(res);
  },
};
