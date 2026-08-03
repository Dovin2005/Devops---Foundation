import { locationRepository } from '../repositories/location.repository.js';
import { auditLogRepository } from '../repositories/auditLog.repository.js';
import { authService } from './auth.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export const analyticsService = {
  async overview() {
    const now = Date.now();
    const [locations, userCounts, actions24h, actions7d, recent] = await Promise.all([
      locationRepository.list(),
      authService.userCounts(),
      auditLogRepository.countSince(new Date(now - DAY_MS)),
      auditLogRepository.countSince(new Date(now - 7 * DAY_MS)),
      auditLogRepository.recent(10),
    ]);

    const byCity: Record<string, { total: number; active: number }> = {};
    for (const l of locations) {
      byCity[l.city] ??= { total: 0, active: 0 };
      byCity[l.city]!.total += 1;
      if (l.status === 'active') byCity[l.city]!.active += 1;
    }

    return {
      locations: {
        total: locations.length,
        active: locations.filter((l) => l.status === 'active').length,
        byCity,
      },
      users: {
        total: userCounts.reduce((s, c) => s + c.count, 0),
        byRole: userCounts.reduce<Record<string, number>>((acc, c) => {
          acc[c.role] = (acc[c.role] ?? 0) + c.count;
          return acc;
        }, {}),
      },
      activity: {
        adminActions24h: actions24h,
        adminActions7d: actions7d,
        recent: recent.map((r) => ({
          id: r.id,
          action: r.action,
          entity: r.entity,
          actorName: r.actorName,
          actorRole: r.actorRole,
          createdAt: r.createdAt,
        })),
      },
    };
  },
};
