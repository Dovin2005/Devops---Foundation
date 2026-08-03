import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { Provider } from '../models/provider.model.js';

export const providerRepository = {
  create(data: Prisma.ProviderCreateInput): Promise<Provider> {
    return prisma.provider.create({ data });
  },

  // Column-scoped, indexed query. Callers front this with a TTL cache.
  list(filter: { city?: string; categoryId?: string; modality?: string }): Promise<Provider[]> {
    return prisma.provider.findMany({
      where: {
        active: true,
        ...(filter.city ? { city: filter.city } : {}),
        ...(filter.categoryId ? { specialtyIds: { has: filter.categoryId } } : {}),
        ...(filter.modality ? { modes: { has: filter.modality } } : {}),
      },
      orderBy: { rating: 'desc' },
      take: 100,
    });
  },

  findById(id: string): Promise<Provider | null> {
    return prisma.provider.findUnique({ where: { id } });
  },

  findByUserId(userId: string): Promise<Provider | null> {
    return prisma.provider.findFirst({ where: { userId } });
  },

  firstAvailable(filter: { city?: string; modality?: string }): Promise<Provider | null> {
    return prisma.provider.findFirst({
      where: {
        active: true,
        ...(filter.city ? { city: filter.city } : {}),
        ...(filter.modality ? { modes: { has: filter.modality } } : {}),
      },
      orderBy: { rating: 'desc' },
    });
  },

  count(): Promise<number> {
    return prisma.provider.count();
  },
};
