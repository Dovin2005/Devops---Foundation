import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { signToken } from '@ucc/service-kit';

// auth-service isn't running in this suite — stub the Stripe Customer
// lookup/persist calls with an in-memory store so getOrCreateCustomer()
// behaves like the real round trip (create once, reuse after).
vi.mock('../src/clients/authInternalClient.js', () => {
  const store = new Map<string, string>();
  return {
    authInternalClient: {
      getStripeCustomer: vi.fn(async (userId: string) => ({
        stripeCustomerId: store.get(userId) ?? null,
        email: `user-${userId}@demo.ucc.co`,
        name: 'Test Patient',
      })),
      setStripeCustomer: vi.fn(async (userId: string, stripeCustomerId: string) => {
        store.set(userId, stripeCustomerId);
        return { stripeCustomerId };
      }),
    },
  };
});

const { createApp } = await import('../src/app.js');
const { initDb, disconnectDb } = await import('../src/config/db.js');

const app = createApp();
const SECRET = 'dev-change-me';
const patientA = `Bearer ${signToken({ sub: crypto.randomUUID(), role: 'patient', name: 'Ana', type: 'access' }, SECRET)}`;
const patientB = `Bearer ${signToken({ sub: crypto.randomUUID(), role: 'patient', name: 'Beto', type: 'access' }, SECRET)}`;
// stripePaymentMethodId is globally unique and this suite runs against the
// shared (non-reset) dev DB — a fixed literal id would collide with a row
// left over from a previous run.
const uniquePm = (label: string) => `pm_test_${label}_${crypto.randomBytes(4).toString('hex')}`;

beforeAll(async () => { await initDb(); });
afterAll(async () => { await disconnectDb(); });

describe('billing-service · saved payment methods (Stripe Customer + cards)', () => {
  let firstCardId: string;
  let secondCardId: string;

  it('gets-or-creates a Stripe Customer for the caller', async () => {
    const res = await request(app).post('/api/billing/customer').set('Authorization', patientA);
    expect(res.status).toBe(200);
    expect(res.body.stripeCustomerId).toMatch(/^cus_/);
  });

  it('saves a card, attaching it to the customer (first card is auto-default)', async () => {
    const res = await request(app).post('/api/billing/payment-methods').set('Authorization', patientA)
      .send({ paymentMethodId: uniquePm('visa') });
    expect(res.status).toBe(201);
    expect(res.body.paymentMethod.last4).toBe('4242');
    expect(res.body.paymentMethod.isDefault).toBe(true);
    firstCardId = res.body.paymentMethod.id;
  });

  it('saves a second card, not default unless asked', async () => {
    const res = await request(app).post('/api/billing/payment-methods').set('Authorization', patientA)
      .send({ paymentMethodId: uniquePm('mastercard') });
    expect(res.status).toBe(201);
    expect(res.body.paymentMethod.isDefault).toBe(false);
    secondCardId = res.body.paymentMethod.id;
  });

  it('lists both saved cards for the caller only', async () => {
    const res = await request(app).get('/api/billing/payment-methods').set('Authorization', patientA);
    expect(res.status).toBe(200);
    expect(res.body.paymentMethods).toHaveLength(2);

    const other = await request(app).get('/api/billing/payment-methods').set('Authorization', patientB);
    expect(other.body.paymentMethods).toHaveLength(0);
  });

  it('sets a new default — exactly one card stays default', async () => {
    const res = await request(app).put(`/api/billing/payment-methods/${secondCardId}/default`).set('Authorization', patientA);
    expect(res.status).toBe(200);
    expect(res.body.paymentMethod.isDefault).toBe(true);

    const list = await request(app).get('/api/billing/payment-methods').set('Authorization', patientA);
    const defaults = list.body.paymentMethods.filter((p: { isDefault: boolean }) => p.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].id).toBe(secondCardId);
  });

  it('rejects managing another patient\'s card', async () => {
    const res = await request(app).delete(`/api/billing/payment-methods/${firstCardId}`).set('Authorization', patientB);
    expect(res.status).toBe(404);
  });

  it('deletes a card, detaching it from the customer', async () => {
    const res = await request(app).delete(`/api/billing/payment-methods/${firstCardId}`).set('Authorization', patientA);
    expect(res.status).toBe(204);
    const list = await request(app).get('/api/billing/payment-methods').set('Authorization', patientA);
    expect(list.body.paymentMethods).toHaveLength(1);
  });
});

describe('billing-service · appointment payment with a saved card + webhook reconciliation', () => {
  const bookingId = crypto.randomUUID();
  const userSub = crypto.randomUUID();
  const userToken = `Bearer ${signToken({ sub: userSub, role: 'patient', name: 'Carla', type: 'access' }, SECRET)}`;
  const internal = { 'x-internal-secret': 'dev-change-me-internal' };
  let gatewayRef: string;

  it('pre-authorizes for a signed-in user and returns their Stripe Customer id', async () => {
    const res = await request(app).post('/api/billing/internal/bookings/preauth').set(internal).send({
      bookingId, userId: userSub, amountUsd: 75, currency: 'usd', paymentMethodId: uniquePm('new'), savePaymentMethod: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.payment.status).toBe('approved');
    expect(res.body.customerId).toMatch(/^cus_/);
    gatewayRef = res.body.payment.gatewayRef;

    const saved = await request(app).get('/api/billing/payment-methods').set('Authorization', userToken);
    expect(saved.body.paymentMethods).toHaveLength(1);
  });

  it('reconciles a payment_intent.payment_failed webhook onto the local payment row', async () => {
    const res = await request(app).post('/api/billing/webhooks/stripe').send({
      id: 'evt_test_1', type: 'payment_intent.payment_failed', data: { object: { id: gatewayRef } },
    });
    expect(res.status).toBe(200);

    const list = await request(app).get(`/api/billing/bookings/${bookingId}/payments`).set('Authorization', userToken);
    expect(list.body.payments[0].status).toBe('declined');
  });
});
