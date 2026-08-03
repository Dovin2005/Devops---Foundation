import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

// Honors the X-Request-Id Kong sets (correlation-id plugin); generates one otherwise.
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  (req as Request & { id: string }).id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
