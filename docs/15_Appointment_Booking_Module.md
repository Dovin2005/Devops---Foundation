# Appointment Booking Module (Backend)

Guest-first appointment booking wizard, matching the UI: **consultation
option → date/time + doctor → book (details + intake) → pay + confirmation**.
Booking/scheduling lives in **core-service**; card payments live in
**billing-service** behind an internal API.

The wizard is deliberately collapsed into two calls instead of four (hold,
intake, pay, get-confirmation) to cut round trips for both the guest and
registered-patient flows:

1. **Booking API** — slot selection + intake + consents in one call.
2. **Payment & Confirmation API** — pre-auth in one call; the response already
   carries the confirmed booking, case, and payment, so no follow-up GET is
   needed.

## Flow

| Step | Endpoint | Notes |
|------|----------|-------|
| 1. Consultation option | `GET /api/scheduling/consultation-options` | Telehealth $75 · In-office $100 · Home visit $175 (single source: `MODALITY_PRICE_USD` in `@ucc/types`) |
| 2. Doctor | `GET /api/scheduling/providers?modality=&city=&specialty=` | Public directory; each doctor includes the consultation options they offer |
| 3. Date & time | `GET /api/scheduling/providers/:id/availability?days=7` | 30-min business-hours grid minus taken slots |
| 4. Booking API | `POST /api/scheduling/bookings` | Combines the old hold + intake calls. Slot is reserved (10-min hold) at submit time, with intake answers and consents attached in the same request. Double-booking returns 409; guests must sign the consent trio (treatment, data_privacy, telehealth) |
| 5. Payment & Confirmation API | `POST /api/scheduling/bookings/:id/pay` | Combines the old pay + get-confirmation calls. Stripe **pre-auth** (manual capture — "charged when the visit starts"). Response: `{ booking, case, payment, coordinatorId }` — booking → `confirmed`, UCC number assigned, case + intake created, coordinator round-robin |
| My appointments | `GET /api/scheduling/bookings/mine` | Patient JWT required |
| Cancel | `POST /api/scheduling/bookings/:id/cancel` | Releases the Stripe pre-auth |

**Guests vs registered patients** — the same two endpoints serve both:

- **Guest** (no `Authorization` header): must send `guest: { email, phone? }`
  and `persons: [...]`, plus the full consent trio in `intake.consents`, on
  the Booking API call.
- **Registered patient** (Bearer token): sends only the appointment details +
  intake; `patientId` comes from the JWT and `persons` defaults from the
  patient record. An invalid token is rejected (401), never silently
  downgraded to guest.

## Payments (billing-service + Stripe)

- `stripeGateway` ([adapters/stripeGateway.ts](../services/billing-service/src/adapters/stripeGateway.ts))
  creates a **manual-capture PaymentIntent** confirmed with the client-supplied
  Stripe `PaymentMethod` id (`pm_...` from Stripe.js — raw card numbers never
  reach the backend; in test mode it defaults to `pm_card_visa`).
- Set `STRIPE_SECRET_KEY` in billing-service’s env to go live; **leave it empty
  to run the deterministic mock gateway** (dev/tests/Postman work end-to-end).
- Prices are quoted USD; `currency: "cop"` charges COP at the day’s TRM
  (`TRM_RATE`, default 4100). The `payments` row snapshots both amounts.
- Internal endpoints (`x-internal-secret`, not routed through Kong):
  `POST /api/billing/internal/bookings/preauth | capture | cancel` —
  idempotent per booking via `payments.idemKey`.
- Staff endpoints: `GET /api/billing/bookings/:bookingId/payments`,
  `POST /api/billing/bookings/:bookingId/capture` (coordinator/OM/super-admin/physician)
  to capture when the visit starts.

## Single `public` schema

All tables now live in the default **public** schema of the shared Postgres
database (the old per-service schemas `auth`, `core`, `billing`, … are left
untouched as a rollback and can be dropped once verified).

- `npm run db:push` — merges every service’s `prisma/schema.prisma` into
  `prisma/merged.prisma` and pushes it to `public`. Use this instead of
  per-service `prisma db push`/`migrate` (a single service pushing against the
  shared schema would try to drop the other services’ tables).
- `npm run db:copy-to-public` — one-time, idempotent copy of the old schemas’
  rows into `public` (already executed).
- All `DATABASE_URL`s (service `.env`s, docker-compose) now use
  `?schema=public`.

## Kong

`/api/scheduling` is now a **public** route (guests book without a JWT);
`/api/patients` keeps the edge `jwt` plugin. Endpoints that need a session
(e.g. `/bookings/mine`) verify the token in-service.

## Postman & tests

- Postman: folder **Appointment Booking** in
  `postman/collections/UCC-APIs.postman_collection.json` (guest flow, registered
  patient flow, staff billing flow) with assertions + variable chaining. Run:

  ```
  npx newman run postman/collections/UCC-APIs.postman_collection.json \
    -e postman/environments/local.postman_environment.json \
    --folder "Appointment Booking"
  ```

- Unit/integration: `services/core-service/test/booking.test.ts` (wizard order,
  guest + member flows; billing client mocked) and
  `services/billing-service/test/billing.test.ts` (pre-auth idempotency,
  capture RBAC, cancel-after-capture guard).
