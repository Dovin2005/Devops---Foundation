// Notification transports — one adapter per channel. `email`/`sms` call real
// providers (SendGrid/Twilio) using credentials fetched fresh from auth-service's
// Settings module (see clients/authInternalClient.ts) — no local caching, so a
// Super Admin credential change takes effect on the very next send. `in_app`/
// `push` stay mocked until those vendor decisions close.
import crypto from 'node:crypto';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { getIntegrationSecrets } from '../clients/authInternalClient.js';
import { logger } from '../utils/logger.js';

const ref = (p: string) => `${p}_${crypto.randomBytes(6).toString('hex')}`;

export interface SendInput {
  to?: string;
  title: string;
  body: string;
}
export interface Transport {
  channel: 'in_app' | 'email' | 'sms' | 'whatsapp' | 'push';
  send(input: SendInput): Promise<{ messageRef: string; status: 'sent' | 'failed' }>;
}

const mock = (channel: Transport['channel']): Transport => ({
  channel,
  async send(input) {
    logger.info({ channel, to: input.to }, 'mock notification send (no provider configured)');
    return { messageRef: ref(channel), status: 'sent' };
  },
});

const emailTransport: Transport = {
  channel: 'email',
  async send(input) {
    if (!input.to) return { messageRef: ref('email'), status: 'failed' };
    const creds = await getIntegrationSecrets('sendgrid').catch(() => ({}) as Record<string, string>);
    if (!creds.apiKey || !creds.senderEmail) return mock('email').send(input);
    try {
      sgMail.setApiKey(creds.apiKey);
      await sgMail.send({ to: input.to, from: creds.senderEmail, subject: input.title, text: input.body });
      return { messageRef: ref('email'), status: 'sent' };
    } catch (err) {
      logger.error({ err }, 'sendgrid send failed');
      return { messageRef: ref('email'), status: 'failed' };
    }
  },
};

const smsTransport: Transport = {
  channel: 'sms',
  async send(input) {
    if (!input.to) return { messageRef: ref('sms'), status: 'failed' };
    const creds = await getIntegrationSecrets('twilio').catch(() => ({}) as Record<string, string>);
    if (!creds.accountSid || !creds.authToken || !creds.phoneNumber) return mock('sms').send(input);
    try {
      const client = twilio(creds.accountSid, creds.authToken);
      const msg = await client.messages.create({ to: input.to, from: creds.phoneNumber, body: input.body });
      return { messageRef: msg.sid, status: 'sent' };
    } catch (err) {
      logger.error({ err }, 'twilio send failed');
      return { messageRef: ref('sms'), status: 'failed' };
    }
  },
};

export const transports: Record<Transport['channel'], Transport> = {
  in_app: mock('in_app'),
  email: emailTransport,
  sms: smsTransport,
  whatsapp: mock('whatsapp'),
  push: mock('push'),
};

export function getTransport(channel: Transport['channel']): Transport {
  return transports[channel] ?? transports.in_app;
}
