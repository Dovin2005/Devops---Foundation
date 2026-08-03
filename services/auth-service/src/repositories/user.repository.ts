import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { User } from '../models/user.model.js';
import type { Role } from '@ucc/types';

// Data-access layer — the only place that talks to Prisma for users.
export const userRepository = {
  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email: string, role?: Role | Role[]): Promise<User | null> {
    const roleFilter = Array.isArray(role) ? { role: { in: role } } : role ? { role } : {};
    return prisma.user.findFirst({ where: { email: email.toLowerCase(), ...roleFilter } });
  },

  findByPhone(phone: string, role?: Role): Promise<User | null> {
    return prisma.user.findFirst({ where: { phone, ...(role ? { role } : {}) } });
  },

  async updateLinks(id: string, data: { patientId?: string; locationId?: string }): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  },

  count(): Promise<number> {
    return prisma.user.count();
  },

  // Platform-wide user counts grouped by role+status (superadmin analytics).
  async countsByRole(): Promise<Array<{ role: string; status: string; count: number }>> {
    const groups = await prisma.user.groupBy({ by: ['role', 'status'], _count: { _all: true } });
    return groups.map((g) => ({ role: g.role, status: g.status, count: g._count._all }));
  },

  // Roster for a role (coordinator round-robin, provider directory sync, etc.).
  listByRole(role: Role, city?: string) {
    return prisma.user.findMany({
      where: { role, status: 'active', ...(city ? { city } : {}) },
      select: { id: true, firstName: true, lastName: true, city: true },
      take: 200,
    });
  },
};
