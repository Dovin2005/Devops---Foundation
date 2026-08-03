import type { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { ServiceOffering } from '../models/serviceOffering.model.js';

// Data-access layer — the only place that talks to Prisma for the services catalog.
export const serviceOfferingRepository = {
  list(status?: string): Promise<ServiceOffering[]> {
    return prisma.serviceOffering.findMany({
      where: status ? { status } : {},
      orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
    });
  },

  findById(id: string): Promise<ServiceOffering | null> {
    return prisma.serviceOffering.findUnique({ where: { id } });
  },

  create(data: Prisma.ServiceOfferingCreateInput): Promise<ServiceOffering> {
    return prisma.serviceOffering.create({ data });
  },

  update(id: string, data: Prisma.ServiceOfferingUpdateInput): Promise<ServiceOffering> {
    return prisma.serviceOffering.update({ where: { id }, data });
  },

  delete(id: string): Promise<ServiceOffering> {
    return prisma.serviceOffering.delete({ where: { id } });
  },
};
