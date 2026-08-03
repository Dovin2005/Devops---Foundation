import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { INTERNAL_SECRET_HEADER, buildActorHeaders } from '@ucc/service-kit';
import { createApp } from '../src/app.js';
import { initDb, disconnectDb } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const app = createApp();
const BASE = '/api/auth/internal/admin';
const internalHeaders = { [INTERNAL_SECRET_HEADER]: env.internalSecret };
const actorHeaders = buildActorHeaders({ id: crypto.randomUUID(), role: 'super_admin', name: 'Daniel Mejía' });

beforeAll(async () => { await initDb(); }, 120_000);
afterAll(async () => { await disconnectDb(); });
// A failed assertion between spying on fetch and manually restoring it would
// otherwise leak the mock into later tests/files (single worker, fileParallelism: false).
afterEach(() => { vi.restoreAllMocks(); });

function mockCoreCreate(kind: 'patient' | 'provider') {
  return vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    status: 201,
    json: async () => (kind === 'patient'
      ? { patient: { id: crypto.randomUUID(), userId: null, idType: null, idNumber: null } }
      : { provider: { id: crypto.randomUUID(), userId: null } }),
  } as Response);
}

describe('internal admin API · create user (any of the eight canonical roles)', () => {
  it('rejects without the internal secret', async () => {
    const res = await request(app).post(`${BASE}/users`).send({ role: 'nurse', email: 'x@demo.ucc.co', password: 'Str0ng!Pass', firstName: 'X', lastName: 'Y' });
    expect(res.status).toBe(401);
  });

  it('creates a staff account (no core-service call) — active immediately', async () => {
    const fetchMock = vi.spyOn(global, 'fetch');
    const email = `nurse-${Date.now()}@demo.ucc.co`;
    const res = await request(app).post(`${BASE}/users`).set(internalHeaders).set(actorHeaders)
      .send({ role: 'nurse', email, password: 'Str0ng!Pass', firstName: 'Laura', lastName: 'Gómez' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('nurse');
    expect(res.body.user.status).toBe('active');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates a patient account and orchestrates a core-service Patient profile', async () => {
    const fetchMock = mockCoreCreate('patient');
    const email = `admin-patient-${Date.now()}@demo.ucc.co`;
    const res = await request(app).post(`${BASE}/users`).set(internalHeaders).set(actorHeaders)
      .send({ role: 'patient', email, password: 'Str0ng!Pass', firstName: 'Camila', lastName: 'Vargas', idType: 'CC', idNumber: '999' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('patient');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('creates a physician account active + credentialsVerified, with encounter privileges and languages', async () => {
    const fetchMock = mockCoreCreate('provider');
    const email = `admin-physician-${Date.now()}@demo.ucc.co`;
    const res = await request(app).post(`${BASE}/users`).set(internalHeaders).set(actorHeaders).send({
      role: 'physician', email, password: 'Str0ng!Pass', firstName: 'Mateo', lastName: 'Suárez',
      physicianType: 'GP', physicianLicenseNo: 'COL-999999',
      encounterPrivileges: ['telehealth', 'in_office', 'at_home'], languages: ['es', 'en'], city: 'Bogotá',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('physician');
    expect(res.body.user.credentialsVerified).toBe(true);
    expect(res.body.user.physicianLicenseNo).toBe('COL-999999');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('records an audit entry for the created user', async () => {
    const fetchMock = vi.spyOn(global, 'fetch');
    const email = `admin-marketing-${Date.now()}@demo.ucc.co`;
    await request(app).post(`${BASE}/users`).set(internalHeaders).set(actorHeaders)
      .send({ role: 'marketing', email, password: 'Str0ng!Pass', firstName: 'Carolina', lastName: 'Duque' });
    const logs = await request(app).get(`${BASE}/audit-logs?action=user.create`).set(internalHeaders);
    expect(logs.status).toBe(200);
    expect(logs.body.total).toBeGreaterThanOrEqual(1);
  });
});
