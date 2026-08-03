import { HttpError, pageParams } from '@ucc/service-kit';
import type { JwtClaims } from '@ucc/types';
import { prisma } from '../config/db.js';
import { caseRepository } from '../repositories/booking.repository.js';
import { providerRepository } from '../repositories/provider.repository.js';
import type { CaseEntity } from '../models/case.model.js';

export const caseService = {
  // Row-level scope by role. Every list is paginated (bounded result set).
  async list(user: JwtClaims, query: Record<string, unknown>) {
    const { skip, take, page, pageSize } = pageParams(query);
    let items: CaseEntity[] = [];
    let total = 0;

    if (user.role === 'patient') {
      [items, total] = await caseRepository.listByPatient(user.patientId ?? '', skip, take);
    } else if (user.role === 'physician') {
      const provider = await providerRepository.findByUserId(user.sub);
      if (provider) [items, total] = await caseRepository.listByProvider(provider.id, skip, take);
    } else if (user.role === 'coordinator') {
      [items, total] = await caseRepository.listByCoordinator(user.sub, skip, take);
    }
    // office_manager / super_admin location + global scopes added with the admin surface.

    return { cases: items, page, pageSize, total };
  },

  async detail(user: JwtClaims, id: string) {
    const kase = await caseRepository.findById(id);
    if (!kase) throw new HttpError(404, 'Case not found');
    if (user.role === 'patient' && kase.patientId !== user.patientId) throw new HttpError(403, 'Not your case');
    const [intake, consents] = await Promise.all([
      prisma.intake.findFirst({ where: { caseId: id } }),
      prisma.consent.findMany({ where: { caseId: id } }),
    ]);
    return { case: kase, intake, consents };
  },
};
