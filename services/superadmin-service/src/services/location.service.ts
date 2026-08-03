import type { Actor } from '@ucc/service-kit';
import type { CreateLocationInput, UpdateLocationInput } from '@ucc/types';
import { authAdminClient } from '../clients/authAdminClient.js';
import type { LocationDto } from '../clients/authAdmin.types.js';

export const locationService = {
  list(status?: string): Promise<LocationDto[]> {
    return authAdminClient.locations.list(status);
  },

  get(id: string): Promise<LocationDto> {
    return authAdminClient.locations.findById(id);
  },

  create(input: CreateLocationInput, actor: Actor): Promise<LocationDto> {
    return authAdminClient.locations.create(input, actor);
  },

  update(id: string, input: UpdateLocationInput, actor: Actor): Promise<LocationDto> {
    return authAdminClient.locations.update(id, input, actor);
  },

  remove(id: string, hard: boolean, actor: Actor): Promise<LocationDto> {
    return authAdminClient.locations.remove(id, hard, actor);
  },
};
