import type { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { Career } from '../models/career.model.js';

// Data-access layer — the only place that talks to Prisma for careers.
export const careerRepository = {
  list(status?: string): Promise<Career[]> {
    return prisma.career.findMany({
      where: status ? { status } : {},
      orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
    });
  },

  findById(id: string): Promise<Career | null> {
    return prisma.career.findUnique({ where: { id } });
  },

  create(data: Prisma.CareerCreateInput): Promise<Career> {
    return prisma.career.create({ data });
  },

  update(id: string, data: Prisma.CareerUpdateInput): Promise<Career> {
    return prisma.career.update({ where: { id }, data });
  },

  delete(id: string): Promise<Career> {
    return prisma.career.delete({ where: { id } });
  },
};
