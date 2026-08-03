import type { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { ContactSubmission } from '../models/contactSubmission.model.js';

// Data-access layer — the only place that talks to Prisma for contact submissions.
export const contactSubmissionRepository = {
  list(status?: string): Promise<ContactSubmission[]> {
    return prisma.contactSubmission.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string): Promise<ContactSubmission | null> {
    return prisma.contactSubmission.findUnique({ where: { id } });
  },

  create(data: Prisma.ContactSubmissionCreateInput): Promise<ContactSubmission> {
    return prisma.contactSubmission.create({ data });
  },

  update(id: string, data: Prisma.ContactSubmissionUpdateInput): Promise<ContactSubmission> {
    return prisma.contactSubmission.update({ where: { id }, data });
  },

  delete(id: string): Promise<ContactSubmission> {
    return prisma.contactSubmission.delete({ where: { id } });
  },
};
