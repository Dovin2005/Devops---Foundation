import { HttpError, INTERNAL_SECRET_HEADER } from '@ucc/service-kit';
import { env } from '../config/env.js';

const BASE = `${env.authUrl}/api/auth/internal/admin`;

// Fetched fresh on every send (OTP volume is low) so a Super Admin credential
// change takes effect immediately — no cache to invalidate, no restart needed.
export async function getIntegrationSecrets(provider: string): Promise<Record<string, string>> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/integrations/${provider}/secrets`, {
      headers: { [INTERNAL_SECRET_HEADER]: env.internalSecret },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new HttpError(502, 'auth-service unreachable');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(res.status, (data as { message?: string })?.message ?? 'auth-service request failed');
  return (data as { data: Record<string, string> }).data;
}
