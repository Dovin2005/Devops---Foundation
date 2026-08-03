import { HttpError, INTERNAL_SECRET_HEADER } from '@ucc/service-kit';
import type { SendOtpInput } from '@ucc/types';
import { env } from '../config/env.js';

const BASE = `${env.commsUrl}/api/comms/internal/otp`;

export const commsClient = {
  async sendOtp(input: SendOtpInput): Promise<{ messageRef: string; status: 'sent' | 'failed' }> {
    let res: Response;
    try {
      res = await fetch(BASE, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [INTERNAL_SECRET_HEADER]: env.internalSecret },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new HttpError(502, 'notification-service unreachable');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new HttpError(res.status, (data as { message?: string })?.message ?? 'notification-service request failed');
    return (data as { data: { messageRef: string; status: 'sent' | 'failed' } }).data;
  },
};
