import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

// Abuse guard for OTP generation/verification and registration — keyed by IP +
// email/phone so one bad actor can't lock out a shared IP, but also can't hammer
// a single account from many IPs. ipKeyGenerator normalizes IPv6 addresses so
// a /64 subnet can't be used to dodge the limit (express-rate-limit requires it).
const keyOf = (req: Request): string => {
  const identifier = (req.body as Record<string, unknown> | undefined)?.email
    ?? (req.body as Record<string, unknown> | undefined)?.identifier
    ?? '';
  return `${ipKeyGenerator(req.ip ?? '')}:${String(identifier).toLowerCase()}`;
};

// A factory, not a singleton — each route needs its own counter store.
// Sharing one instance across routes (register, verify, resend, ...) would let
// them drain a single combined budget, blocking a legitimate one-user flow.
export function otpRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyOf,
    message: { error: 'Too many requests — please wait before trying again' },
  });
}
