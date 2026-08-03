import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { signToken, INTERNAL_SECRET_HEADER, ACTOR_HEADERS } from '@ucc/service-kit';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';

const app = createApp();
const admin = `Bearer ${signToken({ sub: crypto.randomUUID(), role: 'super_admin', name: 'Daniel Mejía', type: 'access' }, env.jwtSecret)}`;
const physician = `Bearer ${signToken({ sub: crypto.randomUUID(), role: 'physician', name: 'Andrés Ramírez', type: 'access' }, env.jwtSecret)}`;
// No `marketing` grant in its (empty) permissions matrix.
const nurse = `Bearer ${signToken({ sub: crypto.randomUUID(), role: 'nurse', name: 'Laura Gómez', type: 'access', permissions: { clinical: ['view'] } }, env.jwtSecret)}`;
const marketer = `Bearer ${signToken({
  sub: crypto.randomUUID(), role: 'marketing', name: 'Carolina Duque', type: 'access',
  permissions: { marketing: ['view', 'create', 'edit', 'delete'] },
}, env.jwtSecret)}`;

const fetchMock = vi.fn();
beforeAll(() => { vi.stubGlobal('fetch', fetchMock); });
beforeEach(() => { fetchMock.mockReset(); });

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('superadmin-service · RBAC gate (no auth-service call reached)', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/admin/locations');
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects non-super_admin roles (server-side RBAC, not UI hiding)', async () => {
    const res = await request(app).get('/api/admin/locations').set('Authorization', physician);
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('superadmin-service · proxies to auth-service internal admin API', () => {
  it('forwards a read request with the internal secret and passes through the response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ locations: [{ id: '1', city: 'Bogotá' }] }));

    const res = await request(app).get('/api/admin/locations').set('Authorization', admin);

    expect(res.status).toBe(200);
    expect(res.body.locations).toEqual([{ id: '1', city: 'Bogotá' }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(`${env.authUrl}/api/auth/internal/admin/locations`);
    expect(init.headers[INTERNAL_SECRET_HEADER]).toBe(env.internalSecret);
  });

  it('a mutating request carries actor headers derived from the caller\'s JWT', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ settings: { 'pricing.defaultMarkupPct': 20 } }));

    const res = await request(app).put('/api/admin/settings').set('Authorization', admin)
      .send({ settings: { 'pricing.defaultMarkupPct': 20 } });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.headers[ACTOR_HEADERS.role]).toBe('super_admin');
    expect(decodeURIComponent(init.headers[ACTOR_HEADERS.name])).toBe('Daniel Mejía');
  });

  it('propagates auth-service error responses with the same status/shape', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Unknown role — the eight platform roles are fixed' }, 404));

    const res = await request(app).put('/api/admin/roles/janitor').set('Authorization', admin).send({ scope: 'x' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/eight platform roles/);
  });

  it('validates request bodies locally before ever calling auth-service', async () => {
    const res = await request(app).post('/api/admin/locations').set('Authorization', admin)
      .send({ city: 'Miami', name: 'Nope' });

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('proxies user creation (any of the eight canonical roles) with actor headers', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { id: crypto.randomUUID(), role: 'nurse', email: 'x@demo.ucc.co', status: 'active' } }, 201));

    const res = await request(app).post('/api/admin/users').set('Authorization', admin)
      .send({ role: 'nurse', email: 'x@demo.ucc.co', password: 'Str0ng!Pass', firstName: 'Laura', lastName: 'Gómez' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('nurse');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(`${env.authUrl}/api/auth/internal/admin/users`);
    expect(init.headers[ACTOR_HEADERS.role]).toBe('super_admin');
  });
});

describe('superadmin-service · content CRUD gated by the RoleConfig permission matrix (not a hardcoded role)', () => {
  it('blocks a role with no marketing grant in its JWT-embedded permissions', async () => {
    const res = await request(app).get('/api/admin/categories').set('Authorization', nurse);
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows a non-super_admin role that has the marketing permission (office_manager/marketing use case)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ categories: [{ id: '1', name: 'Cardiology' }] }));
    const res = await request(app).get('/api/admin/categories').set('Authorization', marketer);
    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual([{ id: '1', name: 'Cardiology' }]);
    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(`${env.authUrl}/api/auth/internal/content/categories`);
  });

  it('super_admin bypasses the permission matrix entirely (no permissions claim on its token)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ category: { id: '1', name: 'Cardiology' } }, 201));
    const res = await request(app).post('/api/admin/categories').set('Authorization', admin)
      .send({ name: 'Cardiology', slug: 'cardiology' });
    expect(res.status).toBe(201);
  });

  it('rejects a create without the marketing:create action even if the role has marketing:view', async () => {
    const viewOnly = `Bearer ${signToken({
      sub: crypto.randomUUID(), role: 'coordinator', name: 'Ana García', type: 'access',
      permissions: { marketing: ['view'] },
    }, env.jwtSecret)}`;
    const res = await request(app).post('/api/admin/careers').set('Authorization', viewOnly)
      .send({ title: 'Nurse', department: 'Clinical', location: 'All Cities', employmentType: 'Gig / per-visit', description: 'x' });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
