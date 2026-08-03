# UCC — Performance Engineering (built in, not bolted on)

The platform must stay fast under load and never fall over. This is handled in code from the start; here's what's in place and the standards every service follows.

## Data layer (TypeORM + Postgres)
- **Connection pooling** — one pooled `DataSource` per service, initialized once at boot (never per request). Tuned pg pool: `max` (default 10, env `DB_POOL_SIZE`), `min: 1`, `connectionTimeoutMillis: 5000`, `idleTimeoutMillis: 30000`, `keepAlive: true`. See `services/*/src/config/db.ts`.
- **Indexes on every hot lookup** — e.g. `users(email, role)` unique + `users(role)`; each entity declares `@Index` on the columns it's filtered/joined by (login, foreign keys, status, slot times, case status). Add an index before shipping any new query pattern.
- **Column-scoped, parameterized queries** — repositories select only needed columns and always use parameterized queries (also closes SQL-injection). No `SELECT *` on wide tables in hot paths.
- **No N+1** — relations are loaded explicitly via joins/`relations`, never lazily in loops.
- **Schema-per-service** — physical isolation so one service's load/locks don't touch another's tables.
- **Migrations in prod** — `synchronize` only in dev/test; production applies TypeORM migrations (`src/migrations/`).

## Service layer
- **Pagination on every list** — `pageParams()` in `@ucc/service-kit` caps page size (default 25, max 100). No unbounded result sets ever leave a service.
- **TTL cache for read-mostly data** — `TtlCache` (in-process, LRU-bounded, default 30s) fronts hot, rarely-changing reads (service catalog, provider lists, platform settings) to keep p95 low without a network hop. Swap for Redis when we scale horizontally and need a shared cache.
- **Async all the way** — bcrypt async, no synchronous crypto/JSON on the request path.

## HTTP layer
- **gzip compression** on all responses (`applyBaseMiddleware`).
- **`x-powered-by` and `etag` disabled** — no wasted header/hash work for JSON APIs.
- **Body size limits** (1–2 MB) to reject abusive payloads early.
- **Kong edge**: rate-limiting (tight on auth), keep-alive, correlation ids — bad traffic is shed before it reaches a service.

## Resilience (stays up)
- **Graceful startup/shutdown** — DB pool drained on SIGINT/SIGTERM; the process won't accept traffic until `initDb()` resolves.
- **Structured logging with PII redaction** (`pino`) — cheap, non-blocking, never logs tokens/passwords.
- **Stateless services** behind Kong — horizontally scalable; add replicas without sticky sessions (JWT, no server session store).
- **Health endpoints** (`/health`) are cheap (no DB hit) for fast liveness checks.

## Targets (from UCC_19 F2)
- Dashboards < 3 s at p75 on reference data volumes; patient typeahead search < 1 s.
- These are enforced with indexes + pagination + caching above, and should be load-tested (k6/autocannon) before go-live.

## Not yet (documented for later)
- Redis for shared cache + rate-limit state across replicas.
- Read replicas for reporting/analytics queries.
- Query-level `EXPLAIN ANALYZE` review on the heaviest endpoints during hardening.
