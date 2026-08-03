import { HttpError, type Actor } from '@ucc/service-kit';
import type { SubmitTestimonialInput } from '@ucc/types';
import { testimonialRepository } from '../repositories/testimonial.repository.js';
import type { Testimonial } from '../models/testimonial.model.js';
import { auditService } from './audit.service.js';

export const testimonialService = {
  list(status?: string): Promise<Testimonial[]> {
    return testimonialRepository.list(status);
  },

  async get(id: string): Promise<Testimonial> {
    const testimonial = await testimonialRepository.findById(id);
    if (!testimonial) throw new HttpError(404, 'Testimonial not found');
    return testimonial;
  },

  // Public — no actor, no moderation. Always starts pending.
  submit(input: SubmitTestimonialInput): Promise<Testimonial> {
    return testimonialRepository.create(input);
  },

  async approve(id: string, actor: Actor): Promise<Testimonial> {
    await this.get(id);
    const testimonial = await testimonialRepository.update(id, { status: 'approved', reviewedBy: actor.id, reviewedAt: new Date() });
    await auditService.record(actor, 'testimonial.approve', 'testimonial', id, {});
    return testimonial;
  },

  async reject(id: string, actor: Actor): Promise<Testimonial> {
    await this.get(id);
    const testimonial = await testimonialRepository.update(id, { status: 'rejected', reviewedBy: actor.id, reviewedAt: new Date() });
    await auditService.record(actor, 'testimonial.reject', 'testimonial', id, {});
    return testimonial;
  },

  async remove(id: string, actor: Actor): Promise<void> {
    await this.get(id);
    await testimonialRepository.delete(id);
    await auditService.record(actor, 'testimonial.delete', 'testimonial', id, {});
  },
};
