# UCC — System Architecture

## 1. Topology

```
┌─────────────┐   ┌──────────────┐   ┌───────────────────────────┐
│  React Web   │   │ React Native │   │  Public site (CMS-driven) │
│ (Vite + BS)  │   │  (scaffold)  │   │  ES/EN, attribution capture│
└──────┬───────┘   └──────┬───────┘   └────────────┬──────────────┘
       │        HTTPS / JSON · JWT bearer          │
       └──────────────────┬────────────────────────┘
                          ▼
        ┌────────────────────────────────────┐
        │   Node.js + Express — API v1        │
        │  /api/v1/*  · Swagger at /api/docs  │
        │  Middleware: helmet · CORS · rate-  │
        │  limit · JWT auth · RBAC scope ·    │
        │  validation (Joi) · audit · errors  │
        ├────────────────────────────────────┤
        │  Services: assignment engine ·      │
        │  notification service · quote/OCR · │
        │  dispatch broadcast · invoicing ·   │
        │  attribution · automation triggers  │
        ├────────────────────────────────────┤
        │  Adapters (mock in dev, Phase-0     │
        │  vendor slot-in): Payment ·         │
        │  WhatsApp · Video · EInvoice(DIAN) ·│
        │  Email · Push · AdsExport · OCR     │
        └───────────────┬────────────────────┘
                        ▼
              ┌───────────────────┐
              │  MongoDB (Mongoose)│
              │  + audit collections│
              └───────────────────┘
```

## 2. Monorepo layout

```
C:\UCC-Project\
├── docs/                  # analysis + design + ops documentation
├── backend/               # Node + Express + Mongoose, API v1
│   ├── src/
│   │   ├── config/        # env, db, settings defaults
│   │   ├── middleware/    # auth, rbac, validate, audit, errors, rateLimit
│   │   ├── models/        # Mongoose schemas (FHIR-aligned fields)
│   │   ├── routes/v1/     # versioned resource routers
│   │   ├── controllers/
│   │   ├── services/      # assignment, notify, quotes, dispatch, billing
│   │   ├── adapters/      # payment, whatsapp, video, einvoice, email, ads
│   │   ├── seed/          # demo data: 3 cities, 8 roles, catalogs
│   │   └── openapi/       # OpenAPI 3 spec served by Swagger UI
│   └── tests/             # Jest + Supertest (in-memory Mongo)
├── web/                   # React 18 + Vite + customized Bootstrap 5 (SCSS)
│   └── src/
│       ├── styles/        # brand tokens → Bootstrap overrides (no default look)
│       ├── i18n/          # es (default staff), en; patient-facing full ES/EN
│       ├── api/           # fetch client, auth token store
│       ├── components/    # TopNav, KpiCard, DataTable, StatusChip, PriorityDot,
│       │                  # Timeline, ChartStepRail, ChatThread, CalendarGrid,
│       │                  # EmptyState, Skeleton, Modal, FormField
│       ├── auth/          # per-portal login/register pages
│       └── portals/       # patient/ physician/ coordinator/ office-manager/
│                          # super-admin/ marketing/ fulfillment/ nurse/
└── mobile/                # React Native scaffold (Phase-1 parity plan)
```

## 3. Case state machine

`booked → intake → awaiting_acceptance → accepted → in_consult → orders_pending → in_execution → results_review → billing → closed` (+ `declined` re-route loop, `escalated` flag). Stage number 1–12 derived for display; transitions validated server-side and audited.

## 4. RBAC model

JWT payload: `{ sub, role, locationId?, name }`. Middleware `requireRole(...roles)` + row-level scope filters:
- Patient → `patientId = self` (incl. dependents)
- Physician → cases where `physicianId = self`
- Coordinator → cases where `coordinatorId = self` (concurrency-capped assignment)
- Office Manager → `locationId = own`
- Nurse → jobs where `nurseId = self` or open broadcasts in own zone
- Marketing → aggregated, de-identified only; Fulfillment → wholesale + dispensing, no PHI
- Super Admin → all, PHI export requires justification (audited)

Approval chains per `UCC_Approval_and_Permission_Matrix` enforced in controllers (refunds, discounts, markup changes, credential approval, buyer approval, PHI export).

## 5. Notification & automation

`notify(event, recipients, channels)` fans out through adapter registry (in-app always; email/WhatsApp/push per user prefs + suppression list). Journey events (booking confirmed, case assigned, quote sent, results ready, invoice issued, dispatch broadcast, adverse event) trigger automation sequences (delay + branch model stored per campaign) — executed by an in-process scheduler in dev.

## 6. Assignment & dispatch engines

- **Coordinator round-robin:** eligible = active coordinators in patient's city with `activeCases < maxActiveCases`, language match preferred; least-recently-assigned wins.
- **Physician reassignment on decline:** earliest available slot closest to requested time.
- **Nurse dispatch:** broadcast to nurses whose service area covers the patient zone; first `accept` wins (atomic claim); re-broadcast after timeout.

## 7. Non-functional

Rate limiting (per-IP), helmet headers, bcrypt password hashing, request validation on every write, structured logs (pino), health endpoint, idempotency keys on payments, soft-delete + audit trail, indexes per query pattern (see `07_Database_Schema_ER.md`), lazy-loaded portal bundles + code splitting on web.
