import { HttpError, INTERNAL_SECRET_HEADER } from '@ucc/service-kit';
import { env } from '../config/env.js';

const BASE = `${env.authUrl}/api/auth/internal/users`;

async function call<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      ...init,
      headers: { 'content-type': 'application/json', [INTERNAL_SECRET_HEADER]: env.internalSecret, ...init.headers },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new HttpError(502, 'auth-service unreachable');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(res.status, (data as { message?: string })?.message ?? 'auth-service request failed');
  return (data as { data: T }).data;
}

export interface UserStripeCustomerDto {
  stripeCustomerId: string | null;
  email: string;
  name: string;
}

export const authInternalClient = {
  getStripeCustomer: (userId: string) => call<UserStripeCustomerDto>(`/${userId}/stripe-customer`, { method: 'GET' }),
  setStripeCustomer: (userId: string, stripeCustomerId: string) =>
    call<{ stripeCustomerId: string }>(`/${userId}/stripe-customer`, { method: 'PUT', body: JSON.stringify({ stripeCustomerId }) }),
};
