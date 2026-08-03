import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INTERNAL_SECRET_HEADER, buildActorHeaders } from '@ucc/service-kit';
import { createApp } from '../src/app.js';
import { initDb, disconnectDb } from '../src/config/db.js';
import { seed } from '../src/seed.js';
import { env } from '../src/config/env.js';

const app = createApp();
const INTERNAL_BASE = '/api/auth/internal/content';
const PUBLIC_BASE = '/api/auth/public';
const internalHeaders = { [INTERNAL_SECRET_HEADER]: env.internalSecret };
const actorHeaders = buildActorHeaders({ id: crypto.randomUUID(), role: 'super_admin', name: 'Daniel Mejía' });

beforeAll(async () => { await initDb(); await seed(); }, 120_000);
afterAll(async () => { await disconnectDb(); });

describe('internal content API · secret gate', () => {
  it('rejects requests without the internal secret', async () => {
    const res = await request(app).get(`${INTERNAL_BASE}/categories`);
    expect(res.status).toBe(401);
  });
});

describe('internal content API · categories CRUD (soft delete by default)', () => {
  let id: string;

  it('lists the seeded specialty categories', async () => {
    const res = await request(app).get(`${INTERNAL_BASE}/categories`).set(internalHeaders);
    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBeGreaterThanOrEqual(4);
  });

  it('creates a category', async () => {
    const res = await request(app).post(`${INTERNAL_BASE}/categories`).set(internalHeaders).set(actorHeaders)
      .send({ name: 'Neurology (test)', slug: 'neurology-test' });
    expect(res.status).toBe(201);
    expect(res.body.category.status).toBe('active');
    id = res.body.category.id;
  });

  it('rejects a duplicate slug', async () => {
    const res = await request(app).post(`${INTERNAL_BASE}/categories`).set(internalHeaders).set(actorHeaders)
      .send({ name: 'Neurology dup (test)', slug: 'neurology-test' });
    expect(res.status).toBe(409); // Prisma unique-constraint violation (P2002) via the shared error handler
  });

  it('deactivates (soft delete) by default', async () => {
    const res = await request(app).delete(`${INTERNAL_BASE}/categories/${id}`).set(internalHeaders).set(actorHeaders);
    expect(res.status).toBe(200);
    expect(res.body.category.status).toBe('inactive');
  });

  it('only "active" categories are exposed publicly', async () => {
    const res = await request(app).get(`${PUBLIC_BASE}/categories`);
    expect(res.status).toBe(200);
    expect(res.body.categories.find((c: { id: string }) => c.id === id)).toBeUndefined();
  });

  it('hard-deletes with ?hard=true', async () => {
    const res = await request(app).delete(`${INTERNAL_BASE}/categories/${id}?hard=true`).set(internalHeaders).set(actorHeaders);
    expect(res.status).toBe(200);
    const gone = await request(app).get(`${INTERNAL_BASE}/categories/${id}`).set(internalHeaders);
    expect(gone.status).toBe(404);
  });
});

describe('public content API · reads only the publicly-visible subset', () => {
  it('lists locations (Location CRUD already existed — this is the new public read)', async () => {
    const res = await request(app).get(`${PUBLIC_BASE}/locations`);
    expect(res.status).toBe(200);
    expect(res.body.locations.length).toBeGreaterThanOrEqual(3);
    expect(res.body.locations.every((l: { status: string }) => l.status === 'active')).toBe(true);
  });

  it('services/faqs/careers start empty until an admin publishes something', async () => {
    const services = await request(app).get(`${PUBLIC_BASE}/services`);
    const faqs = await request(app).get(`${PUBLIC_BASE}/faqs`);
    const careers = await request(app).get(`${PUBLIC_BASE}/careers`);
    expect(services.status).toBe(200);
    expect(faqs.status).toBe(200);
    expect(careers.status).toBe(200);
  });
});

describe('public content API · testimonials (submit → pending → admin moderates → approved is public)', () => {
  let id: string;

  it('accepts an unauthenticated submission, defaulting to pending', async () => {
    const res = await request(app).post(`${PUBLIC_BASE}/testimonials`).send({
      patientName: 'Laurance Grant', rating: 5, quote: 'Quick answers, in-person visits for every health need.',
    });
    expect(res.status).toBe(201);
    expect(res.body.testimonial.status).toBe('pending');
    id = res.body.testimonial.id;
  });

  it('a pending testimonial is not publicly listed yet', async () => {
    const res = await request(app).get(`${PUBLIC_BASE}/testimonials`);
    expect(res.body.testimonials.find((t: { id: string }) => t.id === id)).toBeUndefined();
  });

  it('admin approves it — now it is publicly listed', async () => {
    const approve = await request(app).post(`${INTERNAL_BASE}/testimonials/${id}/approve`).set(internalHeaders).set(actorHeaders);
    expect(approve.status).toBe(200);
    expect(approve.body.testimonial.status).toBe('approved');

    const res = await request(app).get(`${PUBLIC_BASE}/testimonials`);
    expect(res.body.testimonials.some((t: { id: string }) => t.id === id)).toBe(true);
  });
});

describe('public content API · Contact Us submission → admin inbox', () => {
  it('accepts an unauthenticated submission', async () => {
    const res = await request(app).post(`${PUBLIC_BASE}/contact`).send({
      name: 'Vanessa Toro', email: 'vanessa@example.com', message: 'How do I book a home visit?',
    });
    expect(res.status).toBe(201);
    expect(res.body.submission.status).toBe('new');
  });

  it('admin marks it read', async () => {
    const list = await request(app).get(`${INTERNAL_BASE}/contact-submissions`).set(internalHeaders);
    const submission = list.body.submissions[0];
    const res = await request(app).put(`${INTERNAL_BASE}/contact-submissions/${submission.id}/status`).set(internalHeaders).set(actorHeaders)
      .send({ status: 'read' });
    expect(res.status).toBe(200);
    expect(res.body.submission.status).toBe('read');
  });
});
