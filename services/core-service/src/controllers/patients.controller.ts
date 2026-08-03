import type { Request, Response } from 'express';
import { ok, okList, created, deleted } from '@ucc/service-kit';
import { patientService } from '../services/patient.service.js';

export const patientsController = {
  async search(req: Request, res: Response) {
    okList(res, await patientService.search(req.user!, String(req.query.q ?? '')));
  },
  async get(req: Request, res: Response) {
    ok(res, await patientService.get(req.user!, req.params.id!));
  },
  async update(req: Request, res: Response) {
    ok(res, await patientService.update(req.user!, req.params.id!, req.body));
  },
  async addDependent(req: Request, res: Response) {
    created(res, await patientService.addDependent(req.user!, req.params.id!, req.body));
  },
  async removeDependent(req: Request, res: Response) {
    await patientService.removeDependent(req.user!, req.params.id!, req.params.depId!);
    deleted(res);
  },
};
