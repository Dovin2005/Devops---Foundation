import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb, disconnectDb } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const app = createApp();
const BASE = '/api/core/internal/admin';
const internalHeaders = { 'x-internal-secret': env.internalSecret };

beforeAll(async () => { await initDb(); }, 120_000);
afterAll(async () => { await disconnectDb(); });

describe('core-service · internal admin API · secret gate', () => {
  it('rejects requests without the internal secret', async () => {
    const res = await request(app).post(`${BASE}/patients`).send({ userId: crypto.randomUUID(), firstName: 'X', lastName: 'Y' });
    expect(res.status).toBe(401);
  });
});

describe('core-service · internal admin API · create patient with profile', () => {
  it('creates a patient with address, emergency contact, family members, and consents in one transaction', async () => {
    const res = await request(app).post(`${BASE}/patients`).set(internalHeaders).send({
      userId: crypto.randomUUID(),
      firstName: 'Camila',
      lastName: 'Vargas',
      email: 'camila.vargas@demo.ucc.co',
      idType: 'CC',
      idNumber: '1029384756',
      address: 'Cra 45 #10-20',
      neighborhood: 'El Poblado',
      country: 'Colombia',
      city: 'Medellín',
      emergencyContactName: 'Luis Vargas',
      emergencyContactPhone: '+57 300 000 0000',
      emergencyContactRelationship: 'Father',
      familyMembers: [{ fullName: 'Sofía Vargas', relationship: 'Daughter' }],
      consents: ['data_privacy', 'treatment'],
    });
    expect(res.status).toBe(201);
    expect(res.body.patient.idNumber).toBe('1029384756');
    expect(res.body.patient.addresses[0]).toMatchObject({ line1: 'Cra 45 #10-20', neighbourhood: 'El Poblado', country: 'Colombia' });
    expect(res.body.patient.emergencyContact).toMatchObject({ name: 'Luis Vargas', relationship: 'Father' });
  });

  it('rejects a create-patient request missing required fields', async () => {
    const res = await request(app).post(`${BASE}/patients`).set(internalHeaders).send({ userId: crypto.randomUUID() });
    expect(res.status).toBe(400);
  });
});

describe('core-service · internal admin API · create provider', () => {
  it('creates an active provider with encounter privileges and languages', async () => {
    const res = await request(app).post(`${BASE}/providers`).set(internalHeaders).send({
      userId: crypto.randomUUID(),
      firstName: 'Mateo',
      lastName: 'Suárez',
      type: 'GP',
      specialtyIds: [],
      specialtyNames: ['General Medicine'],
      city: 'Bogotá',
      modes: ['telehealth', 'in_office', 'at_home'],
      languages: ['es', 'en'],
      active: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.provider.modes).toEqual(['telehealth', 'in_office', 'at_home']);
    expect(res.body.provider.languages).toEqual(['es', 'en']);
    expect(res.body.provider.active).toBe(true);
  });
});
