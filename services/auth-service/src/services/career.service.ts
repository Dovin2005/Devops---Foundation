import { HttpError, type Actor } from '@ucc/service-kit';
import type { CreateCareerInput, UpdateCareerInput } from '@ucc/types';
import { careerRepository } from '../repositories/career.repository.js';
import type { Career } from '../models/career.model.js';
import { auditService } from './audit.service.js';

export const careerService = {
  list(status?: string): Promise<Career[]> {
    return careerRepository.list(status);
  },

  async get(id: string): Promise<Career> {
    const career = await careerRepository.findById(id);
    if (!career) throw new HttpError(404, 'Career opening not found');
    return career;
  },

  async create(input: CreateCareerInput, actor: Actor): Promise<Career> {
    const career = await careerRepository.create(input);
    await auditService.record(actor, 'career.create', 'career', career.id, { title: career.title });
    return career;
  },

  async update(id: string, input: UpdateCareerInput, actor: Actor): Promise<Career> {
    await this.get(id);
    const career = await careerRepository.update(id, input);
    await auditService.record(actor, 'career.update', 'career', id, { fields: Object.keys(input) });
    return career;
  },

  async remove(id: string, actor: Actor): Promise<void> {
    const existing = await this.get(id);
    await careerRepository.delete(id);
    await auditService.record(actor, 'career.delete', 'career', id, { title: existing.title });
  },
};
