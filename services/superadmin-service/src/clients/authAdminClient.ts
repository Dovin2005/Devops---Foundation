import { HttpError, INTERNAL_SECRET_HEADER, buildActorHeaders, type Actor } from '@ucc/service-kit';
import { env } from '../config/env.js';
import type {
  LocationDto, RoleConfigDto, AuditLogDto, AnalyticsOverviewDto, UserDto,
  CategoryDto, ServiceOfferingDto, FaqDto, CareerDto, TestimonialDto, ContactSubmissionDto,
} from './authAdmin.types.js';

const BASE = `${env.authUrl}/api/auth/internal/admin`;
const CONTENT_BASE = `${env.authUrl}/api/auth/internal/content`;

interface Envelope<T> {
  message: string;
  totalCount: number | null;
  data: T;
}

async function request<T>(base: string, method: string, path: string, opts: { body?: unknown; actor?: Actor; query?: Record<string, unknown> } = {}): Promise<Envelope<T>> {
  const url = new URL(base + path);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    [INTERNAL_SECRET_HEADER]: env.internalSecret,
    ...(opts.actor ? buildActorHeaders(opts.actor) : {}),
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new HttpError(502, 'auth-service unreachable');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(res.status, (body as { message?: string })?.message ?? 'auth-service request failed');
  return body as Envelope<T>;
}

async function call<T>(method: string, path: string, opts?: { body?: unknown; actor?: Actor; query?: Record<string, unknown> }): Promise<T> {
  return (await request<T>(BASE, method, path, opts)).data;
}

async function callContent<T>(method: string, path: string, opts?: { body?: unknown; actor?: Actor; query?: Record<string, unknown> }): Promise<T> {
  return (await request<T>(CONTENT_BASE, method, path, opts)).data;
}

export const authAdminClient = {
  locations: {
    list: (status?: string) => call<LocationDto[]>('GET', '/locations', { query: { status } }),
    findById: (id: string) => call<LocationDto>('GET', `/locations/${id}`),
    create: (body: unknown, actor: Actor) => call<LocationDto>('POST', '/locations', { body, actor }),
    update: (id: string, body: unknown, actor: Actor) => call<LocationDto>('PUT', `/locations/${id}`, { body, actor }),
    remove: (id: string, hard: boolean, actor: Actor) =>
      call<LocationDto>('DELETE', `/locations/${id}`, { query: { hard: hard || undefined }, actor }),
  },
  roles: {
    list: () => call<RoleConfigDto[]>('GET', '/roles'),
    update: (role: string, body: unknown, actor: Actor) => call<RoleConfigDto>('PUT', `/roles/${role}`, { body, actor }),
  },
  settings: {
    getAll: () => call<Record<string, unknown>>('GET', '/settings'),
    updateMany: (settings: Record<string, unknown>, actor: Actor) =>
      call<Record<string, unknown>>('PUT', '/settings', { body: { settings }, actor }),
  },
  integrations: {
    getAll: (provider?: string) => call<Record<string, Record<string, string>>>('GET', '/integrations', { query: { provider } }),
    updateMany: (provider: string, values: Record<string, string>, actor: Actor) =>
      call<Record<string, string>>('PUT', '/integrations', { body: { provider, values }, actor }),
  },
  auditLogs: {
    // Server nests the page under `data` and the true total under `totalCount`
    // (see okPage in @ucc/service-kit) — recombine into the shape this
    // service's own audit.service.ts expects.
    async search(query: Record<string, unknown>): Promise<{ logs: AuditLogDto[]; total: number; page: number; pageSize: number }> {
      const envelope = await request<{ items: AuditLogDto[]; page: number; pageSize: number }>(BASE, 'GET', '/audit-logs', { query });
      return { logs: envelope.data.items, total: envelope.totalCount ?? envelope.data.items.length, page: envelope.data.page, pageSize: envelope.data.pageSize };
    },
  },
  analytics: {
    overview: () => call<AnalyticsOverviewDto>('GET', '/analytics-overview'),
  },
  users: {
    create: (body: unknown, actor: Actor) => call<UserDto>('POST', '/users', { body, actor }),
  },
  content: {
    categories: {
      list: (status?: string) => callContent<CategoryDto[]>('GET', '/categories', { query: { status } }),
      create: (body: unknown, actor: Actor) => callContent<CategoryDto>('POST', '/categories', { body, actor }),
      findById: (id: string) => callContent<CategoryDto>('GET', `/categories/${id}`),
      update: (id: string, body: unknown, actor: Actor) => callContent<CategoryDto>('PUT', `/categories/${id}`, { body, actor }),
      remove: (id: string, hard: boolean, actor: Actor) =>
        callContent<CategoryDto>('DELETE', `/categories/${id}`, { query: { hard: hard || undefined }, actor }),
    },
    services: {
      list: (status?: string) => callContent<ServiceOfferingDto[]>('GET', '/services', { query: { status } }),
      create: (body: unknown, actor: Actor) => callContent<ServiceOfferingDto>('POST', '/services', { body, actor }),
      findById: (id: string) => callContent<ServiceOfferingDto>('GET', `/services/${id}`),
      update: (id: string, body: unknown, actor: Actor) => callContent<ServiceOfferingDto>('PUT', `/services/${id}`, { body, actor }),
      remove: (id: string, actor: Actor) => callContent<null>('DELETE', `/services/${id}`, { actor }),
    },
    faqs: {
      list: (status?: string) => callContent<FaqDto[]>('GET', '/faqs', { query: { status } }),
      create: (body: unknown, actor: Actor) => callContent<FaqDto>('POST', '/faqs', { body, actor }),
      findById: (id: string) => callContent<FaqDto>('GET', `/faqs/${id}`),
      update: (id: string, body: unknown, actor: Actor) => callContent<FaqDto>('PUT', `/faqs/${id}`, { body, actor }),
      remove: (id: string, actor: Actor) => callContent<null>('DELETE', `/faqs/${id}`, { actor }),
    },
    careers: {
      list: (status?: string) => callContent<CareerDto[]>('GET', '/careers', { query: { status } }),
      create: (body: unknown, actor: Actor) => callContent<CareerDto>('POST', '/careers', { body, actor }),
      findById: (id: string) => callContent<CareerDto>('GET', `/careers/${id}`),
      update: (id: string, body: unknown, actor: Actor) => callContent<CareerDto>('PUT', `/careers/${id}`, { body, actor }),
      remove: (id: string, actor: Actor) => callContent<null>('DELETE', `/careers/${id}`, { actor }),
    },
    testimonials: {
      list: (status?: string) => callContent<TestimonialDto[]>('GET', '/testimonials', { query: { status } }),
      approve: (id: string, actor: Actor) => callContent<TestimonialDto>('POST', `/testimonials/${id}/approve`, { actor }),
      reject: (id: string, actor: Actor) => callContent<TestimonialDto>('POST', `/testimonials/${id}/reject`, { actor }),
      remove: (id: string, actor: Actor) => callContent<null>('DELETE', `/testimonials/${id}`, { actor }),
    },
    contactSubmissions: {
      list: (status?: string) => callContent<ContactSubmissionDto[]>('GET', '/contact-submissions', { query: { status } }),
      updateStatus: (id: string, status: string, actor: Actor) =>
        callContent<ContactSubmissionDto>('PUT', `/contact-submissions/${id}/status`, { body: { status }, actor }),
      remove: (id: string, actor: Actor) => callContent<null>('DELETE', `/contact-submissions/${id}`, { actor }),
    },
  },
};
