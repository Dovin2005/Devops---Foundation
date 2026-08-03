import { HttpError, encryptSecret, decryptSecret, maskSecret, type Actor } from '@ucc/service-kit';
import { PROVIDER_FIELDS, type IntegrationProvider } from '@ucc/types';
import { integrationCredentialRepository } from '../repositories/integrationCredential.repository.js';
import { groupByProvider } from '../models/integrationCredential.model.js';
import { env } from '../config/env.js';
import { auditService } from './audit.service.js';

// Best-effort live validation before saving (Domain Cautions: "validate whenever
// possible"). Plain REST checks — no need for the full provider SDKs in this
// service (those live in notification-service / billing-service, which send).
async function validateProvider(provider: IntegrationProvider, values: Record<string, string>): Promise<void> {
  try {
    if (provider === 'twilio' && values.accountSid && values.authToken) {
      const auth = Buffer.from(`${values.accountSid}:${values.authToken}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${values.accountSid}.json`, {
        headers: { authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error('rejected');
    } else if (provider === 'sendgrid' && values.apiKey) {
      const res = await fetch('https://api.sendgrid.com/v3/scopes', {
        headers: { authorization: `Bearer ${values.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error('rejected');
    } else if (provider === 'stripe' && values.secretKey) {
      const res = await fetch('https://api.stripe.com/v1/account', {
        headers: { authorization: `Bearer ${values.secretKey}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error('rejected');
    }
  } catch {
    throw new HttpError(400, `Could not validate ${provider} credentials — check the values and try again`);
  }
}

function mask(provider: IntegrationProvider, key: string, value: string): string {
  const isSecret = PROVIDER_FIELDS[provider]?.[key]?.isSecret ?? true;
  return isSecret ? maskSecret(value) : value;
}

export const integrationCredentialService = {
  // Super Admin view — secrets masked, never the raw value.
  async getMasked(provider?: string): Promise<Record<string, Record<string, string>>> {
    const rows = await integrationCredentialRepository.list(provider);
    const grouped = groupByProvider(rows);
    const out: Record<string, Record<string, string>> = {};
    for (const [p, fields] of Object.entries(grouped)) {
      out[p] = {};
      for (const [key, { value, isSecret }] of Object.entries(fields)) {
        const plain = decryptSecret(value, env.encryptionMasterKey);
        out[p]![key] = isSecret ? maskSecret(plain) : plain;
      }
    }
    return out;
  },

  // Internal only (service-to-service) — real decrypted values, e.g. so
  // notification-service can send with the actual Twilio/SendGrid credentials.
  async getDecrypted(provider: string): Promise<Record<string, string>> {
    const rows = await integrationCredentialRepository.list(provider);
    const out: Record<string, string> = {};
    for (const row of rows) out[row.key] = decryptSecret(row.valueEncrypted, env.encryptionMasterKey);
    return out;
  },

  async updateMany(provider: IntegrationProvider, values: Record<string, string>, actor: Actor): Promise<Record<string, string>> {
    const fields = PROVIDER_FIELDS[provider];
    if (!fields) throw new HttpError(400, `Unknown integration provider: ${provider}`);

    await validateProvider(provider, values);

    const before = await this.getMasked(provider);
    const entries = Object.entries(values)
      .filter(([key]) => key in fields)
      .map(([key, value]) => ({
        key,
        valueEncrypted: encryptSecret(value, env.encryptionMasterKey),
        isSecret: fields[key]!.isSecret,
      }));
    if (entries.length > 0) {
      await integrationCredentialRepository.upsertMany(provider, entries, actor.id);
    }
    const after = await this.getMasked(provider);
    await auditService.record(actor, 'integration.update', 'integration_credential', provider, {
      provider,
      keys: entries.map((e) => e.key),
      before: before[provider] ?? {},
      after: after[provider] ?? {},
    });
    return after[provider] ?? {};
  },
};
