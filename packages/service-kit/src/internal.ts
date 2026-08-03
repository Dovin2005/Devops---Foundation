import type { Request, Response, NextFunction } from 'express';
import type { JwtClaims } from '@ucc/types';
import { HttpError } from './http.js';

// Service-to-service auth for internal (non-Kong-facing) endpoints — a shared
// secret header, since there's no machine-identity token type in this system.
export const INTERNAL_SECRET_HEADER = 'x-internal-secret';

export function requireInternalSecret(secret: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!secret || req.headers[INTERNAL_SECRET_HEADER] !== secret) {
      throw new HttpError(401, 'Internal authentication required');
    }
    next();
  };
}

// Who performed an action — derived from a verified end-user JWT, carried
// across an internal service-to-service call via headers (see below).
export interface Actor {
  id: string;
  role: string;
  name: string;
  requestId?: string;
}

export function actorFrom(user: JwtClaims, requestId?: string): Actor {
  return { id: user.sub, role: user.role, name: user.name, requestId };
}

export const ACTOR_HEADERS = {
  id: 'x-actor-id',
  role: 'x-actor-role',
  name: 'x-actor-name',
} as const;

// Header values are effectively ISO-8859-1; actor names carry diacritics
// (e.g. "Daniel Mejía"), so encode/decode rather than send raw UTF-8.
export function buildActorHeaders(actor: Actor): Record<string, string> {
  return {
    [ACTOR_HEADERS.id]: actor.id,
    [ACTOR_HEADERS.role]: actor.role,
    [ACTOR_HEADERS.name]: encodeURIComponent(actor.name),
    ...(actor.requestId ? { 'x-request-id': actor.requestId } : {}),
  };
}

export function actorFromHeaders(req: Request): Actor | null {
  const id = req.header(ACTOR_HEADERS.id);
  const role = req.header(ACTOR_HEADERS.role);
  const name = req.header(ACTOR_HEADERS.name);
  if (!id || !role || !name) return null;
  return { id, role, name: decodeURIComponent(name), requestId: (req as Request & { id?: string }).id };
}
