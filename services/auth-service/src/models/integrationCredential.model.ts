import type { IntegrationCredential } from '../generated/prisma/index.js';

export type { IntegrationCredential };

// Grouped by provider for the Super Admin UI: { stripe: { secretKey: '...', ... }, ... }
export function groupByProvider(rows: IntegrationCredential[]): Record<string, Record<string, { value: string; isSecret: boolean }>> {
  const out: Record<string, Record<string, { value: string; isSecret: boolean }>> = {};
  for (const row of rows) {
    out[row.provider] ??= {};
    out[row.provider]![row.key] = { value: row.valueEncrypted, isSecret: row.isSecret };
  }
  return out;
}
