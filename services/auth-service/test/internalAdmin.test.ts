import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INTERNAL_SECRET_HEADER, buildActorHeaders } from '@ucc/service-kit';
import { createApp } from '../src/app.js';
import { initDb, disconnectDb } from '../src/config/db.js';
import { seed } from '../src/seed.js';
import { env } from '../src/config/env.js';

const app = createApp();
const BASE = '/api/auth/internal/admin';
const internalHeaders = { [INTERNAL_SECRET_HEADER]: env.internalSecret };
const actorHeaders = buildActorHeaders({ id: crypto.randomUUID(), role: 'super_admin', name: 'Daniel Mejía' });

beforeAll(async () => { await initDb(); await seed(); }, 120_000);
afterAll(async () => { await disconnectDb(); });

describe('internal admin API · secret gate', () => {
  it('rejects requests without the internal secret', async () => {
    const res = await request(app).get(`${BASE}/locations`);
    expect(res.status).toBe(401);
  });

  it('rejects requests with the wrong secret', async () => {
    const res = await request(app).get(`${BASE}/locations`).set(INTERNAL_SECRET_HEADER, 'wrong');
    expect(res.status).toBe(401);
  });
});

describe('internal admin API · locations CRUD', () => {
  let id: string;

  it('lists seeded locations', async () => {
    const res = await request(app).get(`${BASE}/locations`).set(internalHeaders);
    expect(res.status).toBe(200);
    expect(res.body.locations.length).toBeGreaterThanOrEqual(3);
  });

  it('creates a location', async () => {
    const res = await request(app).post(`${BASE}/locations`).set(internalHeaders).set(actorHeaders)
      .send({ city: 'Medellín', name: 'UCC Medellín — Laureles (test)', phone: '+57 604 000 0000' });
    expect(res.status).toBe(201);
    expect(res.body.location.status).toBe('active');
    id = res.body.location.id;
  });

  it('rejects a mutation without actor headers', async () => {
    const res = await request(app).post(`${BASE}/locations`).set(internalHeaders)
      .send({ city: 'Medellín', name: 'No actor' });
    expect(res.status).toBe(400);
  });

  it('validates input (unknown city rejected)', async () => {
    const res = await request(app).post(`${BASE}/locations`).set(internalHeaders).set(actorHeaders)
      .send({ city: 'Miami', name: 'Nope' });
    expect(res.status).toBe(400);
  });

  it('updates a location', async () => {
    const res = await request(app).put(`${BASE}/locations/${id}`).set(internalHeaders).set(actorHeaders)
      .send({ phone: '+57 604 111 1111', settings: { telehealth: true } });
    expect(res.status).toBe(200);
    expect(res.body.location.phone).toBe('+57 604 111 1111');
  });

  it('soft-deletes (deactivates) by default, hard-deletes with ?hard=true', async () => {
    const soft = await request(app).delete(`${BASE}/locations/${id}`).set(internalHeaders).set(actorHeaders);
    expect(soft.status).toBe(200);
    expect(soft.body.location.status).toBe('inactive');
    const hard = await request(app).delete(`${BASE}/locations/${id}?hard=true`).set(internalHeaders).set(actorHeaders);
    expect(hard.status).toBe(200);
    const gone = await request(app).get(`${BASE}/locations/${id}`).set(internalHeaders);
    expect(gone.status).toBe(404);
  });
});

describe('internal admin API · role configuration (canonical eight)', () => {
  it('lists all eight roles in canonical order', async () => {
    const res = await request(app).get(`${BASE}/roles`).set(internalHeaders);
    expect(res.status).toBe(200);
    expect(res.body.roles.map((r: { role: string }) => r.role)).toEqual([
      'patient', 'physician', 'coordinator', 'office_manager', 'super_admin', 'marketing', 'fulfillment', 'nurse',
    ]);
  });

  it('updates a role permission matrix', async () => {
    const res = await request(app).put(`${BASE}/roles/nurse`).set(internalHeaders).set(actorHeaders)
      .send({ permissions: { clinical: ['view', 'create', 'edit'], patients: ['view'], scheduling: ['view'] } });
    expect(res.status).toBe(200);
    expect(res.body.role.permissions.clinical).toContain('edit');
  });

  it('refuses to configure a role outside the canonical eight', async () => {
    const res = await request(app).put(`${BASE}/roles/janitor`).set(internalHeaders).set(actorHeaders).send({ scope: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('internal admin API · settings + audit + analytics', () => {
  it('reads seeded settings', async () => {
    const res = await request(app).get(`${BASE}/settings`).set(internalHeaders);
    expect(res.status).toBe(200);
    expect(res.body.settings['pricing.defaultMarkupPct']).toBe(15);
  });

  it('bulk-updates settings atomically', async () => {
    const res = await request(app).put(`${BASE}/settings`).set(internalHeaders).set(actorHeaders)
      .send({ settings: { 'pricing.defaultMarkupPct': 18, 'scheduling.coordinatorConcurrency': 4 } });
    expect(res.status).toBe(200);
    expect(res.body.settings['pricing.defaultMarkupPct']).toBe(18);
    expect(res.body.settings['scheduling.coordinatorConcurrency']).toBe(4);
  });

  it('admin actions land in the audit log with actor + action, name round-trips through headers', async () => {
    const res = await request(app).get(`${BASE}/audit-logs?action=settings.update`).set(internalHeaders);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    const entry = res.body.logs[0];
    expect(entry.actorName).toBe('Daniel Mejía');
    expect(entry.action).toBe('settings.update');
  });

  it('audit log pagination clamps pageSize', async () => {
    const res = await request(app).get(`${BASE}/audit-logs?pageSize=9999`).set(internalHeaders);
    expect(res.status).toBe(200);
    expect(res.body.pageSize).toBe(100);
  });

  it('analytics overview aggregates locations + users + activity (no health field at this layer)', async () => {
    const res = await request(app).get(`${BASE}/analytics-overview`).set(internalHeaders);
    expect(res.status).toBe(200);
    expect(res.body.locations.total).toBeGreaterThanOrEqual(3);
    expect(res.body.users.total).toBeGreaterThanOrEqual(8);
    expect(res.body.activity.adminActions7d).toBeGreaterThanOrEqual(1);
    expect(res.body.health).toBeUndefined();
  });
});
