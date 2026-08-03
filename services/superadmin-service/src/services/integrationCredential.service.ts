import type { Actor } from '@ucc/service-kit';
import type { IntegrationProvider } from '@ucc/types';
import { authAdminClient } from '../clients/authAdminClient.js';

export const integrationCredentialService = {
  getAll(provider?: string): Promise<Record<string, Record<string, string>>> {
    return authAdminClient.integrations.getAll(provider);
  },

  updateMany(provider: IntegrationProvider, values: Record<string, string>, actor: Actor): Promise<Record<string, string>> {
    return authAdminClient.integrations.updateMany(provider, values, actor);
  },
};
