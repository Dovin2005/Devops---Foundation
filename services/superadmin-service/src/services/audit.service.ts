import { authAdminClient } from '../clients/authAdminClient.js';
import type { AuditLogDto } from '../clients/authAdmin.types.js';

export const auditService = {
  search(query: Record<string, unknown>): Promise<{ logs: AuditLogDto[]; total: number; page: number; pageSize: number }> {
    return authAdminClient.auditLogs.search(query);
  },
};
