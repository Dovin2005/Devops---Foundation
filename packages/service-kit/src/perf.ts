import compression from 'compression';
import helmet from 'helmet';
import type { Express } from 'express';

// Apply the standard performance/hardening middleware every service shares.
export function applyBaseMiddleware(app: Express) {
  app.disable('x-powered-by');
  app.disable('etag'); // APIs don't benefit from etag revalidation; skip the hash cost
  // JSON APIs, not browser-rendered pages — CSP/COEP/COOP defaults are meant
  // for HTML responses and would just add noise here.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginOpenerPolicy: false }));
  app.use(compression()); // gzip responses
}

// Tiny in-process TTL cache for hot, read-mostly data (service catalog, provider
// lists, settings). Keeps p95 low without a Redis hop; swap for Redis when
// horizontal scaling needs a shared cache.
export class TtlCache<V> {
  private store = new Map<string, { value: V; expires: number }>();
  constructor(private ttlMs = 30_000, private max = 500) {}

  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) { this.store.delete(key); return undefined; }
    return hit.value;
  }

  set(key: string, value: V): void {
    if (this.store.size >= this.max) {
      const first = this.store.keys().next().value;
      if (first !== undefined) this.store.delete(first);
    }
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  // Memoize an async loader with the TTL.
  async wrap(key: string, loader: () => Promise<V>): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const value = await loader();
    this.set(key, value);
    return value;
  }

  clear(): void { this.store.clear(); }
}

// Cursor/offset pagination helper — every list endpoint uses this so we never
// return unbounded result sets.
export function pageParams(query: Record<string, unknown>, defaultSize = 25, maxSize = 100) {
  const size = Math.min(maxSize, Math.max(1, Number(query.pageSize) || defaultSize));
  const page = Math.max(1, Number(query.page) || 1);
  return { skip: (page - 1) * size, take: size, page, pageSize: size };
}
