import { prisma } from '../config/db.js';
import type { IntegrationCredential } from '../models/integrationCredential.model.js';

export const integrationCredentialRepository = {
  list(provider?: string): Promise<IntegrationCredential[]> {
    return prisma.integrationCredential.findMany({
      where: provider ? { provider } : undefined,
      orderBy: [{ provider: 'asc' }, { key: 'asc' }],
    });
  },

  // Bulk upsert inside one transaction so a credentials save is all-or-nothing.
  upsertMany(
    provider: string,
    entries: Array<{ key: string; valueEncrypted: string; isSecret: boolean }>,
    updatedBy?: string,
  ): Promise<IntegrationCredential[]> {
    return prisma.$transaction(
      entries.map(({ key, valueEncrypted, isSecret }) =>
        prisma.integrationCredential.upsert({
          where: { provider_key: { provider, key } },
          create: { provider, key, valueEncrypted, isSecret, updatedBy },
          update: { valueEncrypted, isSecret, updatedBy },
        }),
      ),
    );
  },
};
