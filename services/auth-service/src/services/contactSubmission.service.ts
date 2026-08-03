import { HttpError, type Actor } from '@ucc/service-kit';
import type { CreateContactSubmissionInput, ContactSubmissionStatus } from '@ucc/types';
import { contactSubmissionRepository } from '../repositories/contactSubmission.repository.js';
import type { ContactSubmission } from '../models/contactSubmission.model.js';
import { auditService } from './audit.service.js';

export const contactSubmissionService = {
  list(status?: string): Promise<ContactSubmission[]> {
    return contactSubmissionRepository.list(status);
  },

  async get(id: string): Promise<ContactSubmission> {
    const submission = await contactSubmissionRepository.findById(id);
    if (!submission) throw new HttpError(404, 'Contact submission not found');
    return submission;
  },

  // Public — no actor, no moderation. Always starts new.
  submit(input: CreateContactSubmissionInput): Promise<ContactSubmission> {
    return contactSubmissionRepository.create(input);
  },

  async markStatus(id: string, status: ContactSubmissionStatus, actor: Actor): Promise<ContactSubmission> {
    await this.get(id);
    const submission = await contactSubmissionRepository.update(id, { status });
    await auditService.record(actor, 'contact_submission.status', 'contact_submission', id, { status });
    return submission;
  },

  async remove(id: string, actor: Actor): Promise<void> {
    await this.get(id);
    await contactSubmissionRepository.delete(id);
    await auditService.record(actor, 'contact_submission.delete', 'contact_submission', id, {});
  },
};
