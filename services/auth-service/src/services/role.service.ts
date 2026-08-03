import { HttpError, type Actor } from '@ucc/service-kit';
import { ROLES, type Role, type UpdateRoleConfigInput } from '@ucc/types';
import type { Prisma } from '../generated/prisma/index.js';
import { roleConfigRepository } from '../repositories/roleConfig.repository.js';
import { toPublicRoleConfig, type PublicRoleConfig } from '../models/role.model.js';
import { auditService } from './audit.service.js';

export const roleService = {
  async list(): Promise<PublicRoleConfig[]> {
    const configs = await roleConfigRepository.list();
    // Present in canonical role order, not alphabetical.
    const byRole = new Map(configs.map((c) => [c.role, c]));
    return ROLES.filter((r) => byRole.has(r)).map((r) => toPublicRoleConfig(byRole.get(r)!));
  },

  // The canonical eight are fixed — only their configuration changes.
  async update(role: string, input: UpdateRoleConfigInput, actor: Actor): Promise<PublicRoleConfig> {
    if (!ROLES.includes(role as Role)) throw new HttpError(404, `Unknown role — the eight platform roles are fixed`);
    const existing = await roleConfigRepository.findByRole(role);
    if (!existing) throw new HttpError(404, 'Role configuration not seeded');
    const updated = await roleConfigRepository.update(role, {
      ...input,
      ...(input.permissions !== undefined ? { permissions: input.permissions as Prisma.InputJsonValue } : {}),
      updatedBy: actor.id,
    });
    await auditService.record(actor, 'role.update', 'role_config', role, { fields: Object.keys(input) });
    return toPublicRoleConfig(updated);
  },
};
