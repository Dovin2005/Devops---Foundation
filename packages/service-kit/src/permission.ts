import type { Request, Response, NextFunction } from 'express';
import type { PermissionAction, PermissionModule } from '@ucc/types';
import { HttpError } from './http.js';

// Fine-grained enforcement on top of the coarse requireRole allowlist — checks
// the PermissionMatrix snapshot embedded in the JWT at sign time (see
// JwtClaims.permissions) rather than looking the role up per request, so this
// works uniformly in every service with zero extra I/O. super_admin always
// passes, matching every other admin gate in this codebase.
export function requirePermission(module: PermissionModule, action: PermissionAction) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    if (req.user.role === 'super_admin') return next();
    if (req.user.permissions?.[module]?.includes(action)) return next();
    throw new HttpError(403, 'Insufficient permissions for this action');
  };
}
