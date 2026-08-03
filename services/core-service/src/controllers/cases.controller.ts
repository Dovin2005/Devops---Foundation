import type { Request, Response } from 'express';
import { ok, okList, okPage } from '@ucc/service-kit';
import { caseService } from '../services/case.service.js';
import { availabilityService } from '../services/availability.service.js';

export const casesController = {
  async list(req: Request, res: Response) {
    const { cases, page, pageSize, total } = await caseService.list(req.user!, req.query as Record<string, unknown>);
    okPage(res, cases, { page, pageSize, totalCount: total });
  },
  async detail(req: Request, res: Response) {
    ok(res, await caseService.detail(req.user!, req.params.id!));
  },
  async availability(req: Request, res: Response) {
    const days = Math.min(14, Math.max(1, Number(req.query.days) || 7));
    okList(res, await availabilityService.forProvider(req.params.id!, days));
  },
};
