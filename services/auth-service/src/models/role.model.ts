import type { RoleConfig } from '../generated/prisma/index.js';
import type { PermissionMatrix, PhiExportLevel, Role } from '@ucc/types';

export type { RoleConfig };

export interface PublicRoleConfig {
  role: Role;
  scope: string;
  description: string | null;
  permissions: PermissionMatrix;
  phiExport: PhiExportLevel;
  updatedAt: Date;
}

export function toPublicRoleConfig(rc: RoleConfig): PublicRoleConfig {
  return {
    role: rc.role as Role,
    scope: rc.scope,
    description: rc.description,
    permissions: (rc.permissions ?? {}) as PermissionMatrix,
    phiExport: rc.phiExport as PhiExportLevel,
    updatedAt: rc.updatedAt,
  };
}
