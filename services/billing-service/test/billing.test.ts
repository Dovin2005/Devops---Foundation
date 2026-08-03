import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { signToken } from '@ucc/service-kit';
import { createApp } from '../src/app.js';
import { initDb, disconnectDb } from '../src/config/db.js';

const app = createApp();
const SECRET = 'dev-change-me';
const coordinator = `Bearer ${signToken({ sub: crypto.randomUUID(), role: 'coordinator', name: 'Ana García', type: 'access' }, SECRET)}`;
const patId = crypto.randomUUID();
const patient = `Bearer ${signToken({ sub: crypto.randomUUID(), role: 'patient', patientId: patId, name: 'María', type: 'access' }, SECRET)}`;
const caseId = crypto.randomUUID();

beforeAll(async () => { await initDb(); });
afterAll(async () => { await disconnectDb(); });

describe('billing-service · quotes → pay → invoice (USD→COP TRM)', () => {
  let quoteId: string;

  it('coordinator creates a quote with USD lines converted to COP at TRM', async () => {
    const res = await request(app).post('/api/billing/quotes').set('Authorization', coordinator).send({
      caseId, patientId: patId,
      lines: [{ label: 'Chest X-ray', catalogPriceUsd: 40, markupPct: 20 }, { label: 'CBC', catalogPriceUsd: 15, markupPct: 20 }],
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.quote.totalUsd)).toBeCloseTo(66, 1); // (40+15)*1.2
    expect(Number(res.body.quote.totalCop)).toBe(Math.round(66 * 4100));
    expect(Number(res.body.quote.trmRate)).toBe(4100);
    quoteId = res.body.quote.id;
  });

  it('blocks a patient from creating quotes (coordinator+ only)', async () => {
    const res = await request(app).post('/api/billing/quotes').set('Authorization', patient).send({ caseId, lines: [{ label: 'x', catalogPriceUsd: 10, markupPct: 0 }] });
    expect(res.status).toBe(403);
  });

  it('sends then pays the quote', async () => {
    const send = await request(app).post(`/api/billing/quotes/${quoteId}/send`).set('Authorization', coordinator);
    expect(send.status).toBe(200);
    expect(send.body.quote.status).toBe('sent');
    const pay = await request(app).post(`/api/billing/quotes/${quoteId}/pay`).set('Authorization', patient);
    expect(pay.status).toBe(200);
    expect(pay.body.quote.status).toBe('paid');
  });

  it('generates a case invoice (consult + paid quote lines) with a DIAN CUFE', async () => {
    const res = await request(app).post(`/api/billing/cases/${caseId}/invoice`).set('Authorization', coordinator).send({ patientId: patId, consultPriceUsd: 95 });
    expect(res.status).toBe(201);
    expect(res.body.invoice.cufe).toBeTruthy();
    expect(res.body.invoice.number).toMatch(/^UCC-\d{4}-\d{5}$/);
    // consult 95 + quote total 66, all ×TRM
    expect(Number(res.body.invoice.totalCop)).toBe(Math.round((95 + 66) * 4100));
  });

  it('patient pays the invoice one-click', async () => {
    const list = await request(app).get('/api/billing/invoices').set('Authorization', patient);
    expect(list.status).toBe(200);
    const inv = list.body.invoices[0];
    const pay = await request(app).post(`/api/billing/invoices/${inv.id}/pay`).set('Authorization', patient);
    expect(pay.status).toBe(200);
    expect(pay.body.invoice.status).toBe('paid');
  });
});

describe('billing-service · appointment booking payments (Stripe pre-auth)', () => {
  const bookingId = crypto.randomUUID();
  const internal = { 'x-internal-secret': 'dev-change-me-internal' };

  it('rejects internal calls without the shared secret', async () => {
    const res = await request(app).post('/api/billing/internal/bookings/preauth').send({ bookingId, amountUsd: 75 });
    expect(res.status).toBe(401);
  });

  it('pre-authorizes the consult fee (manual capture — charged when the visit starts)', async () => {
    const res = await request(app).post('/api/billing/internal/bookings/preauth').set(internal).send({
      bookingId, patientId: patId, amountUsd: 75, currency: 'usd', customerEmail: 'guest@demo.ucc.co',
    });
    expect(res.status).toBe(201);
    expect(res.body.payment.type).toBe('preauth');
    expect(res.body.payment.status).toBe('approved');
    expect(Number(res.body.payment.amountUsd)).toBe(75);
    expect(Number(res.body.payment.amountCop)).toBe(75 * 4100); // TRM snapshot
  });

  it('is idempotent — a retry returns the same payment', async () => {
    const res = await request(app).post('/api/billing/internal/bookings/preauth').set(internal).send({ bookingId, amountUsd: 75, currency: 'usd' });
    expect(res.status).toBe(201);
    expect(res.body.payment.idemKey).toBe(`booking-${bookingId}-preauth`);
    const list = await request(app).get(`/api/billing/bookings/${bookingId}/payments`).set('Authorization', patient);
    expect(list.body.payments).toHaveLength(1);
  });

  it('captures the pre-auth when the visit starts (staff only)', async () => {
    const forbidden = await request(app).post(`/api/billing/bookings/${bookingId}/capture`).set('Authorization', patient);
    expect(forbidden.status).toBe(403);
    const res = await request(app).post(`/api/billing/bookings/${bookingId}/capture`).set('Authorization', coordinator);
    expect(res.status).toBe(200);
    expect(res.body.payment.status).toBe('captured');
  });

  it('cannot release a captured pre-auth', async () => {
    const res = await request(app).post('/api/billing/internal/bookings/cancel').set(internal).send({ bookingId });
    expect(res.status).toBe(409);
  });
});
