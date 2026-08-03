import type { Actor } from '@ucc/service-kit';
import { authAdminClient } from '../clients/authAdminClient.js';

export const settingService = {
  getAll(): Promise<Record<string, unknown>> {
    return authAdminClient.settings.getAll();
  },

  updateMany(settings: Record<string, unknown>, actor: Actor): Promise<Record<string, unknown>> {
    return authAdminClient.settings.updateMany(settings, actor);
  },
};
