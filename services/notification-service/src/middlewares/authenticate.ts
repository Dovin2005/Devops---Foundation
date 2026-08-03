import { authenticate as f, requireRole } from '@ucc/service-kit';
import { env } from '../config/env.js';
export const authenticate = f(env.jwtSecret);
export { requireRole };
