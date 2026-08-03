import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { defaultMessageFor } from './httpStatus.js';
import { send } from './response.js';

export class HttpError extends Error {
  constructor(public status: number, message?: string) {
    super(message ?? defaultMessageFor(status));
  }
}

// Wrap handlers (sync or async) so thrown errors / rejections reach the error
// middleware.
export const ah =
  (fn: (req: Request, res: Response, next: NextFunction) => unknown) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Throws instead of writing directly — routes through the shared errorHandler
// below so 404 gets the same envelope shape as every other response.
export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, `Not found: ${req.method} ${req.originalUrl}`));
}

// Shared error handler — maps zod / known errors / Prisma unique to clean codes,
// never leaks stack or PII. Every branch funnels through send() so the
// {status,message,validation,totalCount,data} envelope is built in one place.
export function errorHandler(service: string) {
  return (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      return send(res, 400, null, {
        validation: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    if (err instanceof HttpError) return send(res, err.status, null, { message: err.message });
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') return send(res, 409, null, { message: 'That record already exists' });
    if (code === 'P2025') return send(res, 404, null, { message: 'Record not found' });
    console.error(`[${service}] error`, err);
    return send(res, 500, null, {});
  };
}
