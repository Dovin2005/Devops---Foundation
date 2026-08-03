import type { Actor } from '@ucc/service-kit';
import { settingRepository } from '../repositories/setting.repository.js';
import { toSettingsMap } from '../models/setting.model.js';
import { auditService } from './audit.service.js';

export const settingService = {
  async getAll(): Promise<Record<string, unknown>> {
    return toSettingsMap(await settingRepository.list());
  },

  async updateMany(settings: Record<string, unknown>, actor: Actor): Promise<Record<string, unknown>> {
    const entries = Object.entries(settings).map(([key, value]) => ({ key, value }));
    if (entries.length > 0) {
      await settingRepository.upsertMany(entries, actor.id);
      await auditService.record(actor, 'settings.update', 'platform_setting', undefined, { keys: entries.map((e) => e.key) });
    }
    return this.getAll();
  },
};
