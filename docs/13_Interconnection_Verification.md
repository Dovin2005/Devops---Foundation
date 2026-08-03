# UCC — Deep Interconnection & Flow Verification
**Scope (Master Prompt v2, "Deep Interconnection & Flow Verification"):** payment, messaging/communication, and video flows traced end-to-end across the public site and every portal, verified against the implemented API and UI. No dead ends: every step names the next actor and terminal state.

## 1. Payment flow (public site → booking → billing → closure)

| # | Step | Surface | Implementation | Continues to |
|---|------|---------|----------------|--------------|
| 1 | Price discovery | Public `/pricing`, `/services` | `GET /meta/services` (public, safe fields only) | Book CTA → `/patient/register` |
| 2 | Booking pre-auth | Patient portal | `POST /bookings` → `PaymentAdapter.preauth`, slot lock (unique index, 409 on race) | Case created → intake |
| 3 | Quote payment | Patient Bills | `POST /orders/quotes/:id/pay` → capture, orders→paid | Nurse-procedure orders spawn dispatch broadcasts |
| 4 | Case invoice | Coordinator | `POST /billing/cases/:id/invoice` → DIAN adapter (CUFE/CUV) | Patient notified, invoice in Bills |
| 5 | One-click pay | Patient Bills | `POST /billing/invoices/:id/pay` (saved card, idempotency key) | **Case → closed when all orders complete; audit sealed** |
| 6 | Refund | Coordinator request → OM/SA approval | `POST /billing/payments/:id/refund` (approval matrix enforced, audited) | Patient notified; payment history updated |
| 7 | Wholesale payment | Fulfillment portal | Order confirm → auto-invoice (CUFE) → receipt | Buyer tracking updates |

Verified by API tests: quote pay (`quotes → paid`), invoice pay → case close, refund approval gate, idempotency keys. **Terminal state: `case.closed` + paid invoice — no dead end.**

## 2. Messaging & communication flow (matrix: in-app / email / WhatsApp / push; SMS deferred D-17)

| Trigger | Sender → Recipient | Channels | Implementation |
|---------|--------------------|----------|----------------|
| Case assigned (round-robin) | System → Coordinator | in-app, WhatsApp | `assignCoordinator` → `notify()` |
| Case awaiting acceptance | System → Physician | in-app, WhatsApp, email | booking intake |
| Physician accepted/declined | System → Coordinator / next physician | in-app (+WA/email on reassign) | decline auto-reroute |
| Chart sealed / new order | System → Coordinator | in-app (red priority: +WA/email) | order create |
| Quote sent / paid | System → Patient / Coordinator | in-app | quote lifecycle |
| Dispatch accepted / visit completed | System → Coordinator, Physician | in-app (+WA) | nurse job lifecycle |
| Adverse event | System → Coordinator + Physician (+OM if severe) | in-app, WhatsApp, email | severity chain (A-16) |
| Critical result | System → Physician, Coordinator, OM (supervisor) | in-app, WhatsApp, email | order result update |
| Case thread messages | Any participant ↔ case thread | in-app / WhatsApp / email / phone-log | `POST /comms/messages/:caseId`; **internal notes never visible to patients** |
| Overdue follow-up | System → Office Manager | in-app, email | SLA escalation sweep (A-04) |
| Marketing sequences | Campaign → consented patients | per-step channel | opt-in + suppression enforced (`canMarketTo`) |
| Public contact | Visitor → Coordination | form + WhatsApp/phone/email channels listed | `/contact` page |

All sends fan out through the adapter registry honoring user notification prefs and patient suppression; every notification is persisted (`notifications` collection) with status/retry fields. **No orphan triggers: each maps to a recipient and a next action in the recipient's portal.**

## 3. Video consultation flow (public site → in-call → billing)

1. **Public** `/telehealth` explains the 4-step journey → Book CTA (`/patient/register`).
2. **Booking**: modality `telehealth`; physician privilege check (`physician.privileges` includes `telehealth`).
3. **Waiting room / in-call**: patient joins from portal; `POST /video/token` validates participants (patient of the case, its physician, or coordination roles) and issues room + token via `VideoAdapter` (vendor = Phase-0 D-18/B-03; mock in dev).
4. **Consultation**: physician runs the 12-step chart; recording consent (`type: recording`, Res. 2654/2019) captured before start.
5. **Post-call**: chart seal → orders → coordination → results → invoice → payment → closure (flows 1–2 above).

**No dead end:** every video visit terminates in a sealed chart and a billed, closed case.

## 4. Public-site entry-point coverage

Every portal has a labeled entry: `/portals` hub + footer links → `/patient`, `/physician`, `/coordinator`, `/office-manager`, `/super-admin`, `/marketing`, `/fulfillment`, `/nurse` (dedicated branded logins, role-scoped). Wholesale buyers enter via unique invite links (`/wholesale/signup/:token` API). Attribution (UTM/GCLID) is captured on any public landing page and posted to `/marketing/attribution`, then linked to the booking conversion (Stage 1 → Stage 2).

## 5. Verification evidence (2026-07-07)

- 13/13 backend API tests green (payment, dispatch race, chart hard-stops, audit export).
- Preview-verified: public pages render ES-default (`/pricing` "Tarifas transparentes", `/faq`), staff login EN-default (`/physician` "Log in"), doctors/services/locations driven by live public endpoints (9 services, physicians, 3 hospitals), responsive nav at ~375px and desktop.
