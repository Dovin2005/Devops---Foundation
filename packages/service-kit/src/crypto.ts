import crypto from 'node:crypto';

// Symmetric encryption for third-party credentials at rest (Settings module).
// AES-256-GCM keyed off a service-held master secret — never the browser, never
// logs. Payload shape: `<iv>:<authTag>:<ciphertext>` (each base64).
const ALGO = 'aes-256-gcm';

function deriveKey(masterKey: string): Buffer {
  return crypto.scryptSync(masterKey, 'ucc-settings-encryption', 32);
}

export function encryptSecret(plaintext: string, masterKey: string): string {
  const key = deriveKey(masterKey);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((b) => b.toString('base64')).join(':');
}

export function decryptSecret(payload: string, masterKey: string): string {
  const [ivB64, authTagB64, ciphertextB64] = payload.split(':');
  if (!ivB64 || !authTagB64 || !ciphertextB64) throw new Error('Malformed encrypted payload');
  const key = deriveKey(masterKey);
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64')), decipher.final()]);
  return plaintext.toString('utf8');
}

// Show only the last 4 chars of a secret value, for Super Admin display/audit.
export function maskSecret(value: string): string {
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
}
