import type { PlatformSetting } from '../generated/prisma/index.js';

export type { PlatformSetting };

// Settings travel as a flat key→value map; rows are the storage shape.
export function toSettingsMap(rows: PlatformSetting[]): Record<string, unknown> {
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
