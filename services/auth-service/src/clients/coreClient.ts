import { HttpError, INTERNAL_SECRET_HEADER } from '@ucc/service-kit';
import { env } from '../config/env.js';

const BASE = `${env.coreUrl}/api/core/internal/admin`;

async function call<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', [INTERNAL_SECRET_HEADER]: env.internalSecret },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new HttpError(502, 'core-service unreachable');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(res.status, (data as { message?: string })?.message ?? 'core-service request failed');
  return (data as { data: T }).data;
}

export interface CorePatientDto {
  id: string;
  userId: string | null;
  idType: string | null;
  idNumber: string | null;
}

export interface CoreProviderDto {
  id: string;
  userId: string | null;
}

export const coreClient = {
  patients: {
    create: (body: unknown) => call<CorePatientDto>('/patients', body),
  },
  providers: {
    create: (body: unknown) => call<CoreProviderDto>('/providers', body),
  },
  bookings: {
    findGuestStripeCustomer: async (email: string) =>
      (await call<{ stripeCustomerId: string | null }>('/bookings/guest-stripe-customer', { email })).stripeCustomerId,
  },
};
