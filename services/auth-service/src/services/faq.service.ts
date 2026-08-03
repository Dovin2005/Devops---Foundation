import { HttpError, type Actor } from '@ucc/service-kit';
import type { CreateFaqInput, UpdateFaqInput } from '@ucc/types';
import { faqRepository } from '../repositories/faq.repository.js';
import type { Faq } from '../models/faq.model.js';
import { auditService } from './audit.service.js';

export const faqService = {
  list(status?: string): Promise<Faq[]> {
    return faqRepository.list(status);
  },

  async get(id: string): Promise<Faq> {
    const faq = await faqRepository.findById(id);
    if (!faq) throw new HttpError(404, 'FAQ not found');
    return faq;
  },

  async create(input: CreateFaqInput, actor: Actor): Promise<Faq> {
    const faq = await faqRepository.create(input);
    await auditService.record(actor, 'faq.create', 'faq', faq.id, { question: faq.question });
    return faq;
  },

  async update(id: string, input: UpdateFaqInput, actor: Actor): Promise<Faq> {
    await this.get(id);
    const faq = await faqRepository.update(id, input);
    await auditService.record(actor, 'faq.update', 'faq', id, { fields: Object.keys(input) });
    return faq;
  },

  async remove(id: string, actor: Actor): Promise<void> {
    const existing = await this.get(id);
    await faqRepository.delete(id);
    await auditService.record(actor, 'faq.delete', 'faq', id, { question: existing.question });
  },
};
