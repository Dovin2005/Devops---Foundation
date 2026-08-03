import type { Request, Response } from 'express';
import { okList } from '@ucc/service-kit';
import { CONSULTATION_OPTIONS } from '@ucc/types';
import { providerService } from '../services/provider.service.js';

export const providersController = {
  async list(req: Request, res: Response) {
    const providers = await providerService.list({
      city: req.query.city as string | undefined,
      categoryId: req.query.categoryId as string | undefined,
      modality: req.query.modality as string | undefined,
    });
    // Public directory shape — pricing + rating, no PHI. Each doctor carries the
    // consultation options they offer (booking wizard "Select Consultation Options").
    okList(
      res,
      providers.map((p) => ({
        id: p.id, name: `Dr. ${p.firstName} ${p.lastName}`, type: p.type,
        specialtyIds: p.specialtyIds, specialtyNames: p.specialtyNames, city: p.city, modes: p.modes,
        consultPriceUsd: Number(p.consultPriceUsd), rating: Number(p.rating),
        consultationOptions: CONSULTATION_OPTIONS.filter((o) => p.modes.includes(o.code)),
      })),
    );
  },
};
