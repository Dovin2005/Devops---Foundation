import type { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { AuditLog } from '../models/auditLog.model.js';

export interface AuditQuery {
  actorId?: string;
  action?: string;
  entity?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

export const auditLogRepository = {
  create(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
    return prisma.auditLog.create({ data });
  },

  async search(q: AuditQuery): Promise<{ logs: AuditLog[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = {
      ...(q.actorId ? { actorId: q.actorId } : {}),
      ...(q.action ? { action: { startsWith: q.action } } : {}),
      ...(q.entity ? { entity: q.entity } : {}),
      ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } : {}),
    };
    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { logs, total };
  },

  countSince(since: Date): Promise<number> {
    return prisma.auditLog.count({ where: { createdAt: { gte: since } } });
  },

  recent(take = 10): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take });
  },
};
