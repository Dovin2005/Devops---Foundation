import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';

// Body-validation middleware factory. Parsed value replaces req.body so
// controllers receive typed, trusted input.
export function validate<S extends ZodTypeAny>(schema: S) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);
    req.body = parsed.data as ZodInfer<S>;
    next();
  };
}
