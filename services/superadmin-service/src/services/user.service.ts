import type { Actor } from '@ucc/service-kit';
import { authAdminClient } from '../clients/authAdminClient.js';
import type { UserDto } from '../clients/authAdmin.types.js';

export const userService = {
  create(body: unknown, actor: Actor): Promise<UserDto> {
    return authAdminClient.users.create(body, actor);
  },
};
