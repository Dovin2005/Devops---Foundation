import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '@ucc/service-kit';

// Hard gate: this service only serves super_admin. Layered on top of
// authenticate (which fills req.user from the verified JWT).
export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new HttpError(401, 'Authentication required');
  if (req.user.role !== 'super_admin') throw new HttpError(403, 'Super Admin only');
  next();
}
