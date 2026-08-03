import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { signToken } from '@ucc/service-kit';
import { createApp } from '../src/app.js';
import { initDb, disconnectDb } from '../src/config/db.js';
import { seed } from '../src/seed.js';
import { patientRepository } from '../src/repositories/patient.repository.js';
import { providerRepository } from '../src/repositories/provider.repository.js';
import { caseRepository } from '../src/repositories/booking.repository.js';
import { assignmentService } from '../src/services/assignment.service.js';

const app = createApp();
const SECRET = 'dev-change-me';
const bearer = (claims: object) => `Bearer ${signToken({ type: 'access', name: 'Test', ...claims }, SECRET)}`;

let patientId: string;

beforeAll(async () => {
  await initDb();
  await seed();
  const p = await patientRepository.create({ firstName: 'María', lastName: 'Ríos', email: 'maria@demo.ucc.co', allergies: ['Penicillin'] });
  patientId = p.id;
});
afterAll(async () => { await disconnectDb(); });

describe('core-service · patients + dependents (RBAC)', () => {
  it('a patient reads their own record + dependents', async () => {
    const res = await request(app).get(`/api/patients/${patientId}`).set('Authorization', bearer({ sub: 'u1', role: 'patient', patientId }));
    expect(res.status).toBe(200);
    expect(res.body.patient.allergies).toContain('Penicillin');
    expect(Array.isArray(res.body.dependents)).toBe(true);
  });

  it('blocks a patient from reading someone else’s record', async () => {
    const res = await request(app).get(`/api/patients/${patientId}`).set('Authorization', bearer({ sub: 'u2', role: 'patient', patientId: 'other' }));
    expect(res.status).toBe(403);
  });

  it('blocks marketing from patient records', async () => {
    const res = await request(app).get(`/api/patients/${patientId}`).set('Authorization', bearer({ sub: 'm1', role: 'marketing' }));
    expect(res.status).toBe(403);
  });

  it('updates the health chips', async () => {
    const res = await request(app).patch(`/api/patients/${patientId}`)
      .set('Authorization', bearer({ sub: 'u1', role: 'patient', patientId }))
      .send({ allergies: ['Penicillin', 'Ibuprofen'], medications: ['Loratadine 10mg'] });
    expect(res.status).toBe(200);
    expect(res.body.patient.allergies).toHaveLength(2);
  });

  it('adds a dependent', async () => {
    const res = await request(app).post(`/api/patients/${patientId}/dependents`)
      .set('Authorization', bearer({ sub: 'u1', role: 'patient', patientId }))
      .send({ firstName: 'Sofía', lastName: 'Ríos', relationship: 'Child' });
    expect(res.status).toBe(201);
    expect(res.body.dependent.firstName).toBe('Sofía');
  });

  it('requires auth', async () => {
    const res = await request(app).get(`/api/patients/${patientId}`);
    expect(res.status).toBe(401);
  });
});

describe('core-service · cases + availability', () => {
  it('lists a patient’s own cases (paginated)', async () => {
    await caseRepository.create({ bookingId: crypto.randomUUID(), patientId, modality: 'telehealth', serviceCode: '890202', status: 'booked', stage: 3 });
    const res = await request(app).get('/api/scheduling/cases').set('Authorization', bearer({ sub: 'u1', role: 'patient', patientId }));
    expect(res.status).toBe(200);
    expect(res.body.cases.length).toBeGreaterThan(0);
    expect(res.body.pageSize).toBeLessThanOrEqual(100);
  });

  it('returns provider availability slots', async () => {
    const provider = (await providerRepository.list({}))[0]!;
    const res = await request(app).get(`/api/scheduling/providers/${provider.id}/availability?days=3`);
    expect(res.status).toBe(200);
    expect(res.body.availability).toHaveLength(3);
    expect(res.body.availability[0].slots.length).toBeGreaterThan(0);
  });
});

describe('core-service · coordinator round-robin (load-based)', () => {
  it('picks the least-loaded coordinator', async () => {
    const [a, b, c] = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
    // a has 2 active cases, b has 1, c has 0 → c should win.
    await caseRepository.create({ bookingId: crypto.randomUUID(), coordinatorId: a, modality: 'telehealth', serviceCode: 's', status: 'accepted', stage: 5 });
    await caseRepository.create({ bookingId: crypto.randomUUID(), coordinatorId: a, modality: 'telehealth', serviceCode: 's', status: 'accepted', stage: 5 });
    await caseRepository.create({ bookingId: crypto.randomUUID(), coordinatorId: b, modality: 'telehealth', serviceCode: 's', status: 'accepted', stage: 5 });
    const picked = await assignmentService.pick([a, b, c]);
    expect(picked).toBe(c);
  });
});
