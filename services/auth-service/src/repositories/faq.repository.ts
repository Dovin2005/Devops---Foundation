import type { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { Faq } from '../models/faq.model.js';

// Data-access layer — the only place that talks to Prisma for FAQs.
export const faqRepository = {
  list(status?: string): Promise<Faq[]> {
    return prisma.faq.findMany({
      where: status ? { status } : {},
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
    });
  },

  findById(id: string): Promise<Faq | null> {
    return prisma.faq.findUnique({ where: { id } });
  },

  create(data: Prisma.FaqCreateInput): Promise<Faq> {
    return prisma.faq.create({ data });
  },

  update(id: string, data: Prisma.FaqUpdateInput): Promise<Faq> {
    return prisma.faq.update({ where: { id }, data });
  },

  delete(id: string): Promise<Faq> {
    return prisma.faq.delete({ where: { id } });
  },
};
