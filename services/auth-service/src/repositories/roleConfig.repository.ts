import type { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { RoleConfig } from '../models/role.model.js';

export const roleConfigRepository = {
  list(): Promise<RoleConfig[]> {
    return prisma.roleConfig.findMany({ orderBy: { role: 'asc' } });
  },

  findByRole(role: string): Promise<RoleConfig | null> {
    return prisma.roleConfig.findUnique({ where: { role } });
  },

  update(role: string, data: Prisma.RoleConfigUpdateInput): Promise<RoleConfig> {
    return prisma.roleConfig.update({ where: { role }, data });
  },

  upsert(role: string, data: Omit<Prisma.RoleConfigCreateInput, 'role'>): Promise<RoleConfig> {
    return prisma.roleConfig.upsert({ where: { role }, create: { role, ...data }, update: data });
  },

  count(): Promise<number> {
    return prisma.roleConfig.count();
  },
};
