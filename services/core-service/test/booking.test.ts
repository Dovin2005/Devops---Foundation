import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { signToken } from '@ucc/service-kit';

// Payment goes through billing-service (Stripe); unit tests stub the client so
// the suite runs without a second service. The live path is covered by the
// Postman/newman end-to-end flow.
vi.mock('../src/clients/billingClient.js', () => ({
  billingClient: {
    preauthorize: vi.fn(async (body: { bookingId: string; amountUsd: number; currency: string }) => ({
      payment: {
        id: crypto.randomUUID(), bookingId: body.bookingId, type: 'preauth', provider: 'mock',
        gatewayRef: `pi_mock_${crypto.randomBytes(6).toString('hex')}`, status: 'approved',
        amountUsd: body.amountUsd.toFixed(2), amountCop: (body.amountUsd * 4100).toFixed(2), currency: body.currency,
      },
      customerId: `cus_mock_${crypto.randomBytes(6).toString('hex')}`,
    })),
    cancel: vi.fn(async (bookingId: string) => ({
      id: crypto.randomUUID(), bookingId, type: 'preauth', provider: 'mock',
      gatewayRef: 'pi_mock_cancel', status: 'cancelled', amountUsd: '75.00', amountCop: '307500.00', currency: 'usd',
    })),
  },
}));

const { createApp } = await import('../src/app.js');
const { initDb, disconnectDb } = await import('../src/config/db.js');
const { seed } = await import('../src/seed.js');
const { patientRepository } = await import('../src/repositories/patient.repository.js');
const { providerRepository } = await import('../src/repositories/provider.repository.js');

const app = createApp();
const SECRET = 'dev-change-me';

beforeAll(async () => { await initDb(); await seed(); });
afterAll(async () => { await disconnectDb(); });

describe('core-service · appointment booking wizard', () => {
  it('lists the consultation options card (step 1)', async () => {
    const res = await request(app).get('/api/scheduling/consultation-options');
    expect(res.status).toBe(200);
    const codes = res.body.options.map((o: { code: string }) => o.code);
    expect(codes).toEqual(['telehealth', 'in_office', 'at_home']);
    expect(res.body.options[0].priceUsd).toBe(75);
  });

  it('lists the public provider directory with per-doctor consultation options', async () => {
    const res = await request(app).get('/api/scheduling/providers');
    expect(res.status).toBe(200);
    expect(res.body.providers.length).toBeGreaterThan(0);
    const p = res.body.providers[0];
    expect(p.consultPriceUsd).toBeGreaterThan(0);
    expect(p).not.toHaveProperty('userId');
    expect(p.consultationOptions.map((o: { code: string }) => o.code)).toEqual(p.modes);
  });

  it('filters the provider directory by specialty category id', async () => {
    // Self-provisioned rather than relying on seed data — the shared dev DB's
    // seed guard is a no-op once providers already exist from earlier runs.
    const categoryId = crypto.randomUUID();
    await providerRepository.create({
      firstName: 'Isabela', lastName: 'Ruiz', type: 'Specialist',
      specialtyIds: [categoryId], specialtyNames: ['Neurology (test)'],
      city: 'Bogotá', modes: ['telehealth'], active: true,
    });

    const res = await request(app).get(`/api/scheduling/providers?categoryId=${categoryId}`);
    expect(res.status).toBe(200);
    expect(res.body.providers.length).toBeGreaterThan(0);
    for (const p of res.body.providers) {
      expect(p.specialtyIds).toContain(categoryId);
      expect(p.specialtyNames).toContain('Neurology (test)');
    }
  });

  it('exposes a doctor availability grid', async () => {
    const list = await request(app).get('/api/scheduling/providers');
    const res = await request(app).get(`/api/scheduling/providers/${list.body.providers[0].id}/availability?days=2`);
    expect(res.status).toBe(200);
    expect(res.body.availability).toHaveLength(2);
    expect(res.body.availability[0].slots.length).toBeGreaterThan(0);
  });

  const slot = new Date(Date.now() + 2 * 864e5).toISOString();
  let bookingId: string;

  it('rejects a guest booking without contact details', async () => {
    const res = await request(app).post('/api/scheduling/bookings').send({
      modality: 'telehealth', slotStart: slot, persons: [{ firstName: 'A', lastName: 'B' }],
      intake: { reason: 'Fever and cough for three days', consents: [{ type: 'treatment', signedBy: 'A B' }] },
    });
    expect(res.status).toBe(422);
  });

  it('rejects a guest booking when the consent trio is incomplete', async () => {
    const res = await request(app).post('/api/scheduling/bookings').send({
      modality: 'telehealth', city: 'Medellín', slotStart: slot,
      persons: [{ firstName: 'María', lastName: 'Ríos' }],
      guest: { email: 'guest@demo.ucc.co', phone: '+57 300 555 0101' },
      intake: {
        reason: 'Fever and cough for three days',
        consents: [{ type: 'treatment', signedBy: 'María Ríos' }],
      },
    });
    expect(res.status).toBe(422);
  });

  it('books a slot + intake for a guest in one call, with the modality price snapshot', async () => {
    const res = await request(app).post('/api/scheduling/bookings').send({
      modality: 'telehealth', city: 'Medellín', slotStart: slot,
      persons: [{ firstName: 'María', lastName: 'Ríos' }],
      guest: { email: 'guest@demo.ucc.co', phone: '+57 300 555 0101' },
      intake: {
        reason: 'Fever and productive cough for three days, worse at night',
        bodyAreas: ['chest'], onset: 'days', severity: 7, hasFever: true,
        consents: [
          { type: 'treatment', signedBy: 'María Ríos' },
          { type: 'data_privacy', signedBy: 'María Ríos' },
          { type: 'telehealth', signedBy: 'María Ríos' },
        ],
      },
    });
    expect(res.status).toBe(201);
    expect(res.body.booking.status).toBe('held');
    expect(res.body.booking.guestFlag).toBe(true);
    expect(res.body.booking.intakeStatus).toBe('complete');
    expect(Number(res.body.booking.amountUsd)).toBe(75);
    bookingId = res.body.booking.id;
  });

  it('pays (Stripe pre-auth) → confirms with a UCC number and creates the case', async () => {
    const res = await request(app).post(`/api/scheduling/bookings/${bookingId}/pay`).send({ currency: 'usd' });
    expect(res.status).toBe(201);
    expect(res.body.booking.status).toBe('confirmed');
    expect(res.body.booking.preauthStatus).toBe('approved');
    expect(res.body.booking.number).toMatch(/^UCC-\d{4,}$/);
    expect(res.body.payment.status).toBe('approved');
    expect(res.body.case.stage).toBeGreaterThanOrEqual(3);
  });

  it('rejects paying twice', async () => {
    const res = await request(app).post(`/api/scheduling/bookings/${bookingId}/pay`).send({ currency: 'usd' });
    expect(res.status).toBe(409);
  });

  it('cancels the booking and releases the pre-auth', async () => {
    const res = await request(app).post(`/api/scheduling/bookings/${bookingId}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('cancelled');
  });
});

describe('core-service · registered patient booking', () => {
  const slot = new Date(Date.now() + 3 * 864e5).toISOString();
  let patientId: string;
  let token: string;

  beforeAll(async () => {
    const patient = await patientRepository.create({
      firstName: 'Laura', lastName: 'Gómez', email: `laura.${Date.now()}@demo.ucc.co`,
    });
    patientId = patient.id;
    token = `Bearer ${signToken({ sub: crypto.randomUUID(), role: 'patient', name: 'Laura Gómez', patientId, type: 'access' }, SECRET)}`;
  });

  it('books with just the appointment details + intake — persons/guest come from the account', async () => {
    const res = await request(app).post('/api/scheduling/bookings')
      .set('Authorization', token)
      .send({
        modality: 'in_office', city: 'Medellín', slotStart: slot,
        intake: { reason: 'Annual check-up and prescription renewal', consents: [{ type: 'treatment', signedBy: 'Laura Gómez' }] },
      });
    expect(res.status).toBe(201);
    expect(res.body.booking.guestFlag).toBe(false);
    expect(res.body.booking.patientId).toBe(patientId);
    expect(res.body.booking.persons[0].firstName).toBe('Laura');
    expect(Number(res.body.booking.amountUsd)).toBe(100);
    expect(res.body.booking.intakeStatus).toBe('complete');
  });

  it('rejects a garbled session token instead of downgrading to guest', async () => {
    const res = await request(app).post('/api/scheduling/bookings')
      .set('Authorization', 'Bearer not-a-token')
      .send({ modality: 'in_office', slotStart: slot });
    expect(res.status).toBe(401);
  });

  it('lists my appointments', async () => {
    const res = await request(app).get('/api/scheduling/bookings/mine').set('Authorization', token);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.bookings[0].patientId).toBe(patientId);
  });
});
