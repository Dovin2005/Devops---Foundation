import type { Request, Response } from 'express';
import { HttpError, ok, okList, okPage, created } from '@ucc/service-kit';
import { CONSULTATION_OPTIONS } from '@ucc/types';
import { schedulingService } from '../services/scheduling.service.js';

export const bookingsController = {
  // Step 1 — the consultation options card (public, static catalog).
  async consultationOptions(_req: Request, res: Response) {
    okList(res, CONSULTATION_OPTIONS);
  },

  // Booking API — slot selection + intake + consents in one call.
  async book(req: Request, res: Response) {
    created(res, await schedulingService.book(req.body, req.user));
  },

  // Payment & Confirmation API — pre-auth + the full confirmation payload.
  async pay(req: Request, res: Response) {
    created(res, await schedulingService.pay(req.params.id!, req.body, req.user));
  },

  async cancel(req: Request, res: Response) {
    ok(res, await schedulingService.cancel(req.params.id!));
  },

  // "My appointments" — signed-in patients only.
  async listMine(req: Request, res: Response) {
    const patientId = req.user?.patientId;
    if (!patientId) throw new HttpError(403, 'Only patient accounts have appointments');
    const [bookings, total] = await schedulingService.listForPatient(patientId);
    okPage(res, bookings, { page: 1, pageSize: 25, totalCount: total });
  },
};
