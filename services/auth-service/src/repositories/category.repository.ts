import type { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { Category } from '../models/category.model.js';

// Data-access layer — the only place that talks to Prisma for categories.
export const categoryRepository = {
  list(status?: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: status ? { status } : {},
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  },

  findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  },

  // Physician creation resolves display names for the ids an admin picked —
  // same-service lookup, no cross-service call.
  findByIds(ids: string[]): Promise<Category[]> {
    if (!ids.length) return Promise.resolve([]);
    return prisma.category.findMany({ where: { id: { in: ids } } });
  },

  create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data });
  },

  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  },

  delete(id: string): Promise<Category> {
    return prisma.category.delete({ where: { id } });
  },

  count(): Promise<number> {
    return prisma.category.count();
  },
};
