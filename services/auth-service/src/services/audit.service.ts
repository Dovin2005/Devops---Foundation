import type { Actor } from '@ucc/service-kit';
import { auditLogRepository, type AuditQuery } from '../repositories/auditLog.repository.js';
import type { AuditLog } from '../models/auditLog.model.js';

export const auditService = {
  // Fire-and-forget would risk losing entries; we await, but a failed audit
  // write never fails the admin action itself.
  async record(actor: Actor, action: string, entity: string, entityId?: string, detail?: Record<string, unknown>): Promise<void> {
    try {
      await auditLogRepository.create({
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action,
        entity,
        entityId,
        detail: detail as never,
        requestId: actor.requestId,
      });
    } catch {
      // swallow — audit must not break the underlying operation
    }
  },

  search(q: AuditQuery): Promise<{ logs: AuditLog[]; total: number }> {
    return auditLogRepository.search(q);
  },
};
