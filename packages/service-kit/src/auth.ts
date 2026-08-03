import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtClaims, Role } from '@ucc/types';
import { HttpError } from './http.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtClaims;
    }
  }
}

export function verifyToken(token: string, secret: string): JwtClaims {
  return jwt.verify(token, secret, { issuer: 'ucc-auth' }) as JwtClaims;
}

// Sign a token with the shared issuer (used by auth-service and in tests).
export function signToken(claims: object, secret: string, expiresIn: string | number = '15m'): string {
  return jwt.sign(claims, secret, { issuer: 'ucc-auth', expiresIn } as jwt.SignOptions);
}

// authenticate middleware factory (each service passes its JWT_SECRET). Kong
// verifies at the edge; services re-verify (defense in depth) + fill req.user.
export function authenticate(secret: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Authentication required');
    try {
      req.user = verifyToken(token, secret);
      next();
    } catch {
      throw new HttpError(401, 'Invalid or expired session');
    }
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    if (!roles.includes(req.user.role)) throw new HttpError(403, 'Insufficient permissions for this action');
    next();
  };
}
