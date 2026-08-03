import { env } from '../config/env.js';
import { caseRepository } from '../repositories/booking.repository.js';
import type { CaseEntity } from '../models/case.model.js';

// Coordinator round-robin (Scope St.3). Load-based: fewest active cases wins,
// so work spreads evenly and no one coordinator gets buried. The coordinator
// roster lives in auth-service (identity), fetched over its internal endpoint.
export const assignmentService = {
  async fetchCoordinators(city?: string | null): Promise<string[]> {
    try {
      const url = `${env.authUrl}/api/auth/internal/staff?role=coordinator${city ? `&city=${encodeURIComponent(city)}` : ''}`;
      const r = await fetch(url);
      if (!r.ok) return [];
      const d = (await r.json()) as { staff: Array<{ id: string }> };
      return d.staff.map((s) => s.id);
    } catch {
      return []; // best-effort — a case can be assigned later if auth is unreachable
    }
  },

  // Pure selection (unit-testable): pick the least-loaded candidate.
  async pick(candidates: string[]): Promise<string | null> {
    if (!candidates.length) return null;
    const counts = await caseRepository.activeCountByCoordinator(candidates);
    let best: string | null = null;
    let bestN = Infinity;
    for (const id of candidates) {
      const n = counts.get(id) ?? 0;
      if (n < bestN) { bestN = n; best = id; }
    }
    return best;
  },

  async assign(kase: CaseEntity, city?: string | null): Promise<string | null> {
    const coordinatorId = await this.pick(await this.fetchCoordinators(city));
    if (coordinatorId) {
      kase.coordinatorId = coordinatorId;
      kase.status = 'awaiting_acceptance';
      kase.stage = 4;
      await caseRepository.save(kase);
    }
    return coordinatorId;
  },
};
