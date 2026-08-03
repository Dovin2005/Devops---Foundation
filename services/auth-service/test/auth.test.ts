import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb, disconnectDb } from '../src/config/db.js';
import { seed, DEMO_PASSWORD } from '../src/seed.js';
import { userRepository } from '../src/repositories/user.repository.js';

const app = createApp();

beforeAll(async () => { await initDb(); await seed(); });
afterAll(async () => { await disconnectDb(); });
// A failed assertion between spying on fetch and manually restoring it would
// otherwise leak the mock into later tests/files (single worker, fileParallelism: false).
afterEach(() => { vi.restoreAllMocks(); });

// register() calls out to core-service to create the Patient profile — stub
// fetch for just that one call rather than requiring a live core-service.
function mockCorePatientCreate() {
  return vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    status: 201,
    json: async () => ({ patient: { id: crypto.randomUUID(), userId: null, idType: null, idNumber: null } }),
  } as Response);
}

// forgotPassword()/otpResend() call out to notification-service to actually
// send the code — stub fetch for just that one call rather than requiring a
// live notification-service.
function mockCommsSendOtp() {
  return vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ messageRef: crypto.randomUUID(), status: 'sent' }),
  } as Response);
}

describe('auth-service', () => {
  it('health', async () => {
    expect((await request(app).get('/health')).body.ok).toBe(true);
  });

  it('login issues access + refresh tokens (dedicated patient endpoint)', async () => {
    const res = await request(app).post('/api/auth/login/patient').send({ email: 'maria@demo.ucc.co', password: DEMO_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.role).toBe('patient');
  });

  it('role-scoped login blocks cross-portal access', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'maria@demo.ucc.co', password: DEMO_PASSWORD, role: 'physician' });
    expect(res.status).toBe(401);
  });

  it('shared /login rejects patient and super_admin — they have their own endpoints', async () => {
    const patient = await request(app).post('/api/auth/login').send({ email: 'maria@demo.ucc.co', password: DEMO_PASSWORD, role: 'patient' });
    expect(patient.status).toBe(400);
    const admin = await request(app).post('/api/auth/login').send({ email: 'daniel@demo.ucc.co', password: DEMO_PASSWORD, role: 'super_admin' });
    expect(admin.status).toBe(400);
  });

  it('super_admin logs in through the dedicated endpoint', async () => {
    const res = await request(app).post('/api/auth/login/superadmin').send({ email: 'daniel@demo.ucc.co', password: DEMO_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('super_admin');
  });

  it('rejects a bad password', async () => {
    const res = await request(app).post('/api/auth/login/patient').send({ email: 'maria@demo.ucc.co', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('validation rejects a malformed body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: '' });
    expect(res.status).toBe(400);
  });

  it('me returns the current user', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'andres@demo.ucc.co', password: DEMO_PASSWORD, role: 'physician' });
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.role).toBe('physician');
  });

  it('refresh rotates an access token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'ana@demo.ucc.co', password: DEMO_PASSWORD, role: 'coordinator' });
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: login.body.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('forgot-password/options reports the masked email option for a known account (no phone on file)', async () => {
    const res = await request(app).post('/api/auth/forgot-password/options').send({ identifier: 'maria@demo.ucc.co' });
    expect(res.status).toBe(200);
    expect(res.body.options).toEqual([{ channel: 'email', masked: 'm***a@demo.ucc.co' }]);
  });

  it('forgot-password/options returns no options for an unknown identifier (no enumeration)', async () => {
    const res = await request(app).post('/api/auth/forgot-password/options').send({ identifier: `nobody-${Date.now()}@demo.ucc.co` });
    expect(res.status).toBe(200);
    expect(res.body.options).toEqual([]);
  });

  it('forgot-password/options includes a masked sms option when the account has a phone on file', async () => {
    const email = `test${Date.now()}-phone@demo.ucc.co`;
    await userRepository.create({
      role: 'patient', email, passwordHash: 'x', firstName: 'Test', lastName: 'Phone',
      phone: '+57 300 000 0099', languagePref: 'es',
    });

    const res = await request(app).post('/api/auth/forgot-password/options').send({ identifier: email });
    expect(res.status).toBe(200);
    expect(res.body.options).toHaveLength(2);
    const sms = res.body.options.find((o: { channel: string }) => o.channel === 'sms');
    expect(sms.masked).toBe('+** *** *** **99');
    expect(sms.masked).not.toContain('000');
  });

  it('forgot-password sends the code and confirms it with an expiry (no generic message)', async () => {
    const fetchMock = mockCommsSendOtp();
    const res = await request(app).post('/api/auth/forgot-password').send({ identifier: 'maria@demo.ucc.co' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, otpSentVia: 'email' });
    expect(res.body.expiresInSeconds).toBeGreaterThan(0);
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('forgot-password 404s for an unknown identifier', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ identifier: `nobody-${Date.now()}@demo.ucc.co` });
    expect(res.status).toBe(404);
  });

  it('registers a new patient with the full profile field set', async () => {
    const fetchMock = mockCorePatientCreate();
    const email = `test${Date.now()}@demo.ucc.co`;
    const res = await request(app).post('/api/auth/register').send({
      email, password: 'Str0ng!Pass', firstName: 'Test', lastName: 'User',
      idType: 'CC', idNumber: '123456789', address: 'Cra 1 #2-3', neighborhood: 'Centro', country: 'Colombia',
      emergencyContactName: 'Jane User', emergencyContactPhone: '+57 300 000 0000', emergencyContactRelationship: 'Sister',
      familyMembers: [{ fullName: 'Baby User', relationship: 'Child' }],
      consents: ['data_privacy'],
    });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe('patient');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('self-registration is always patient, even if a different role is sent', async () => {
    mockCorePatientCreate();
    const email = `test${Date.now()}-staff@demo.ucc.co`;
    const res = await request(app).post('/api/auth/register').send({ role: 'physician', email, password: 'Str0ng!Pass', firstName: 'Not', lastName: 'Staff' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('patient');
  });

  it('rolls back the User row if core-service rejects the profile create', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false, status: 502, json: async () => ({ error: 'core-service unreachable' }),
    } as Response);
    const email = `test${Date.now()}-rollback@demo.ucc.co`;
    const res = await request(app).post('/api/auth/register').send({ email, password: 'Str0ng!Pass', firstName: 'Test', lastName: 'User' });
    expect(res.status).toBe(502);
    const login = await request(app).post('/api/auth/login/patient').send({ email, password: 'Str0ng!Pass' });
    expect(login.status).toBe(401); // no user was left behind
  });

  it('otp verify accepts the demo code', async () => {
    const res = await request(app).post('/api/auth/otp/verify').send({ email: 'maria@demo.ucc.co', code: '482100' });
    expect(res.body.verified).toBe(true);
  });
});
