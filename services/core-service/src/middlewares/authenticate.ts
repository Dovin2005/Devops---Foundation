import type { Request, Response, NextFunction } from 'express';
import { authenticate as f, requireRole, verifyToken, HttpError } from '@ucc/service-kit';
import { env } from '../config/env.js';
export const authenticate = f(env.jwtSecret);
export { requireRole };

// Booking endpoints serve guests and members alike: no token is fine (guest),
// but a token that is present must be valid — a garbled/expired session should
// surface as 401, not silently downgrade a member to a guest.
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    req.user = verifyToken(header.slice(7), env.jwtSecret);
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired session');
  }
}
