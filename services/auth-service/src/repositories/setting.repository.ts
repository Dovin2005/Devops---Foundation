import type { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { PlatformSetting } from '../models/setting.model.js';

export const settingRepository = {
  list(): Promise<PlatformSetting[]> {
    return prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
  },

  // Bulk upsert inside one transaction so a settings save is all-or-nothing.
  upsertMany(entries: Array<{ key: string; value: unknown }>, updatedBy?: string): Promise<PlatformSetting[]> {
    return prisma.$transaction(
      entries.map(({ key, value }) =>
        prisma.platformSetting.upsert({
          where: { key },
          create: { key, value: value as Prisma.InputJsonValue, updatedBy },
          update: { value: value as Prisma.InputJsonValue, updatedBy },
        }),
      ),
    );
  },

  count(): Promise<number> {
    return prisma.platformSetting.count();
  },
};
