import type { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { Location } from '../models/location.model.js';

// Data-access layer — the only place that talks to Prisma for locations.
export const locationRepository = {
  list(status?: string): Promise<Location[]> {
    return prisma.location.findMany({
      where: status ? { status } : {},
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    });
  },

  findById(id: string): Promise<Location | null> {
    return prisma.location.findUnique({ where: { id } });
  },

  create(data: Prisma.LocationCreateInput): Promise<Location> {
    return prisma.location.create({ data });
  },

  update(id: string, data: Prisma.LocationUpdateInput): Promise<Location> {
    return prisma.location.update({ where: { id }, data });
  },

  delete(id: string): Promise<Location> {
    return prisma.location.delete({ where: { id } });
  },

  count(): Promise<number> {
    return prisma.location.count();
  },
};
