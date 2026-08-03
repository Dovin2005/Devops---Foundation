import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import type { JwtClaims, PermissionMatrix, Role } from '@ucc/types';
import { env } from '../config/env.js';

interface UserForToken {
  id: string;
  role: Role;
  firstName: string;
  lastName: string;
  patientId?: string | null;
  locationId?: string | null;
}

// `iss: ucc-auth` matches the Kong jwt credential `key` so the gateway verifies.
// `permissions` is a snapshot of the role's RoleConfig matrix at sign time
// (see requirePermission in @ucc/service-kit) — refreshed on every
// login/token-refresh, so a permission change takes effect within one cycle.
export function signAccess(user: UserForToken, permissions?: PermissionMatrix): string {
  const claims: JwtClaims = {
    sub: user.id,
    role: user.role,
    name: `${user.firstName} ${user.lastName}`,
    patientId: user.patientId ?? undefined,
    locationId: user.locationId ?? undefined,
    type: 'access',
    permissions,
  };
  return jwt.sign(claims, env.jwtSecret, { expiresIn: env.accessTtl, issuer: 'ucc-auth' } as jwt.SignOptions);
}

export function signRefresh(userId: string): { token: string; hash: string } {
  const token = jwt.sign({ sub: userId, type: 'refresh' }, env.jwtSecret, {
    expiresIn: env.refreshTtl,
    issuer: 'ucc-auth',
  } as jwt.SignOptions);
  return { token, hash: hashToken(token) };
}

export function verifyRefresh(token: string): { sub: string } {
  return jwt.verify(token, env.jwtSecret, { issuer: 'ucc-auth' }) as { sub: string };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
