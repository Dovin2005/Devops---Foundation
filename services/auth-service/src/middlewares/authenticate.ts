import { authenticate as authFactory, requireRole } from '@ucc/service-kit';
import { env } from '../config/env.js';

export const authenticate = authFactory(env.jwtSecret);
export { requireRole };
