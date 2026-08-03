import type { Actor } from '@ucc/service-kit';
import type { UpdateRoleConfigInput } from '@ucc/types';
import { authAdminClient } from '../clients/authAdminClient.js';
import type { RoleConfigDto } from '../clients/authAdmin.types.js';

export const roleService = {
  list(): Promise<RoleConfigDto[]> {
    return authAdminClient.roles.list();
  },

  update(role: string, input: UpdateRoleConfigInput, actor: Actor): Promise<RoleConfigDto> {
    return authAdminClient.roles.update(role, input, actor);
  },
};
