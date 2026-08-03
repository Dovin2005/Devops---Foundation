import type { SendOtpInput, OtpPurpose } from '@ucc/types';
import { getTransport } from '../transport/index.js';

const COPY: Record<OtpPurpose, { title: string; body: (code: string) => string }> = {
  registration: {
    title: 'Verify your account',
    body: (code) => `Your UCC verification code is ${code}. It expires in a few minutes.`,
  },
  password_reset: {
    title: 'Reset your password',
    body: (code) => `Your UCC password reset code is ${code}. If you didn't request this, ignore this message.`,
  },
};

export const otpService = {
  async send(input: SendOtpInput): Promise<{ messageRef: string; status: 'sent' | 'failed' }> {
    const copy = COPY[input.purpose];
    return getTransport(input.channel).send({ to: input.to, title: copy.title, body: copy.body(input.code) });
  },
};
