import crypto from 'node:crypto';
import { HttpError } from '@ucc/service-kit';
import type { OtpPurpose } from '@ucc/types';
import { hashToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/user.repository.js';
import { commsClient } from '../clients/commsClient.js';
import { settingService } from './setting.service.js';
import type { User } from '../models/user.model.js';

const MAX_ATTEMPTS = 5;

async function getOtpConfig(): Promise<{ expiryMinutes: number; resendCooldownSeconds: number; defaultChannel: 'email' | 'sms' }> {
  const settings = await settingService.getAll();
  const expiryMinutes = Number(settings['integrations.otp.expiryMinutes'] ?? 10) || 10;
  const resendCooldownSeconds = Number(settings['integrations.otp.resendCooldownSeconds'] ?? 60) || 60;
  const defaultChannel = settings['integrations.otp.defaultChannel'] === 'sms' ? 'sms' : 'email';
  return { expiryMinutes, resendCooldownSeconds, defaultChannel };
}

function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export interface OtpSendResult {
  channel: 'email' | 'sms';
  expiresAt: Date;
  expiresInSeconds: number;
}

export const otpService = {
  // Picks the delivery channel, generates+stores a hashed code, and dispatches
  // it via notification-service. Never returns the plaintext code to the caller.
  async generateAndSend(user: User, purpose: OtpPurpose, requestedChannel?: 'email' | 'sms'): Promise<OtpSendResult> {
    const config = await getOtpConfig();
    const channel = requestedChannel ?? config.defaultChannel;
    if (channel === 'sms' && !user.phone) throw new HttpError(400, 'No phone number on file — choose email instead');

    const code = generateCode();
    const expiresAt = new Date(Date.now() + config.expiryMinutes * 60_000);
    await userRepository.update(user.id, {
      otpCodeHash: hashToken(code),
      otpPurpose: purpose,
      otpExpiresAt: expiresAt,
      otpSentVia: channel,
      otpLastSentAt: new Date(),
      otpAttempts: 0,
    });

    await commsClient.sendOtp({ channel, to: channel === 'sms' ? user.phone! : user.email, code, purpose });
    return { channel, expiresAt, expiresInSeconds: config.expiryMinutes * 60 };
  },

  async resend(user: User, purpose: OtpPurpose): Promise<OtpSendResult> {
    const config = await getOtpConfig();
    if (user.otpLastSentAt) {
      const elapsedMs = Date.now() - user.otpLastSentAt.getTime();
      const waitMs = config.resendCooldownSeconds * 1000 - elapsedMs;
      if (waitMs > 0) throw new HttpError(429, `Please wait ${Math.ceil(waitMs / 1000)}s before requesting another code`);
    }
    const channel = (user.otpSentVia as 'email' | 'sms' | null) ?? config.defaultChannel;
    return this.generateAndSend(user, purpose, channel);
  },

  // Verifies the code; on success for `registration` activates the account,
  // for `password_reset` leaves a short verified window for resetPassword().
  async verify(user: User, code: string, purpose: OtpPurpose): Promise<void> {
    if (!user.otpCodeHash || user.otpPurpose !== purpose) throw new HttpError(400, 'No pending verification for this request');
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) throw new HttpError(400, 'Code has expired — request a new one');
    if (user.otpAttempts >= MAX_ATTEMPTS) throw new HttpError(429, 'Too many attempts — request a new code');

    if (hashToken(code) !== user.otpCodeHash) {
      await userRepository.update(user.id, { otpAttempts: { increment: 1 } });
      throw new HttpError(401, 'Invalid or expired code');
    }

    if (purpose === 'registration') {
      await userRepository.update(user.id, {
        status: 'active',
        otpCodeHash: null,
        otpPurpose: null,
        otpExpiresAt: null,
        otpAttempts: 0,
      });
    } else {
      // Reset window: code is single-use (cleared), but the purpose + a fresh
      // short expiry stay as the "verified" marker for resetPassword().
      await userRepository.update(user.id, {
        otpCodeHash: null,
        otpExpiresAt: new Date(Date.now() + 10 * 60_000),
        otpAttempts: 0,
      });
    }
  },

  // otpCodeHash is only null once verify() has actually consumed a code —
  // otherwise a bare forgot-password call (no code submitted) would already
  // satisfy purpose+expiry and let resetPassword() through unverified.
  isPasswordResetWindowOpen(user: User): boolean {
    return user.otpPurpose === 'password_reset' && !user.otpCodeHash && !!user.otpExpiresAt && user.otpExpiresAt > new Date();
  },

  async clear(userId: string): Promise<void> {
    await userRepository.update(userId, {
      otpCodeHash: null,
      otpPurpose: null,
      otpExpiresAt: null,
      otpSentVia: null,
      otpAttempts: 0,
    });
  },
};
