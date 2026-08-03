# UCC — Prompt 2 Re-Platform · Phase 0 (Discovery + Architecture Plan)
**Status: PLAN — awaiting go-ahead before any scaffolding (per the prompt's own gate).**
Pass date: 2026-07-14 · Client: Viridis Media Marketing · Product: Urgent Care Colombia (UCC)

---

## 0. TL;DR — the decision you need to make first

Prompt 2 asks to **re-platform** onto a *different stack from everything already built and locked in this repo*:

| Layer | This repo today (PR #1, `CLAUDE.md`-locked) | Prompt 2 mandates |
|---|---|---|
| Frontend | React 18 + **Vite + customized Bootstrap 5 (SCSS)** | React + **TypeScript + Tailwind** |
| Backend | Node + **Express, single service** | Node + **TypeScript, microservices behind Kong** |
| Database | **MongoDB (Mongoose)** | **PostgreSQL + Prisma** |
| Infra | run with node/vite | **Docker Compose** (every service + Kong + Postgres + web) |
| Mobile | React Native scaffold (planned) | Patient app is **mobile-first** (98% of traffic) |

This is **not** an incremental change — it discards most of the ~16k-line build on this branch and contradicts the `CLAUDE.md` stack that you explicitly asked me to lock (commit `d05a289`). That is a genuine, expensive, mostly-irreversible scope decision, so I've stopped here for your call rather than silently rebuilding. **Recommendation in §6.** Nothing has been scaffolded or deleted.

---

## 1. Documentation intake (what arrived with Prompt 2)

| Source | What it is | Verdict |
|---|---|---|
| `prompt-2-claude-code-rebuild.md` | The re-platform brief | The instruction set |
| `UCC_Markdown_Package_CORRECTED_DOCX.zip` | The UCC docs package (35 files) | **Same requirements** I already analyzed/built from — plus one net-new file below |
| └ `UCC_19_Requirements_Closure_Addendum` | NET-NEW: reconciles docs with the 3 patient PDFs | **Authoritative** for patient experience — see §3 |
| `UGC - Design (1).zip` (70 images) | **Figma export — Patient MOBILE app** | New; the visual source of truth for Patient |
| `UGC - Design.zip` (36 images) | **Figma export — Doctor WEB portal** | New; ~80% matches the UI already built |
| `Patient Experience - Master Handoff.pdf` (97pp) | Patient UX handoff + SPEC layer | Distilled into UCC_19 addendum |
| `Patient Portal - Appointment Scheduling.pdf` (31pp) | Booking flow detail | Distilled into UCC_19 §A1/A8 |
| `Patient Portal - Billing & Consents.pdf` (14pp) | Billing + consent detail | Distilled into UCC_19 §A2/A4/A5 |
| `BrandBook.pdf` | Brand identity (read earlier) | Canonical palette (brand book wins over Figma pixels) |

**Naming flags:** the design zips say **"UGC"**, the docs/site say **"UCC" / Urgent Care Colombia**. Treating "UGC" as a typo for UCC. Client is **Viridis Media Marketing**; brand stays **Urgent Care Colombia** (spelling *Colombia*).

## 2. Figma screen inventory (read off the exports)

**Patient — mobile app (~70 screens):** Splash ×3 · Loading · Login · Register · Create-account verification + Enter Code · Forgot-password (verification option → enter code → success) · Dashboard (ranked feed) · Schedule Appointment (Select Visit Type → Doctors List → Filter → Doctor Detail About/Availability/Reviews/No-slot → Payment → Add Card → Confirmation → Success) · Appointment List + Details (Pending/Confirmed/Completed, Review, Cancel + reason, Prescription view, Visit Summary, Waiting Room, **Video Call**, Thank-you) · Medical Records (List, Detail Timeline, Record Details, Care-team message + chat, **Export for Insurance**) · Messages (List, Chat, Compose, Doctor List) · Notifications · Profile (Settings, Family Members, Billing + Billing Details + Pay + Add Card, Prescriptions list/detail/view, **Consents & Privacy**, Security & Passwords, Update Password, Notification Preferences).

**Doctor — web portal (~36 screens):** Dashboard (+ notifications) · Calendar View (In-Office / Telehealth) · Patient Queue (+ navigation popup) · New Patients · **Consultation = the 12-step chart** (Informed Consent · Patient Identification · Past Medical History · Chief Complaint · HPI · Review of Systems · Physical Exam + Vitals · Assessment/Impression · ICD-10/CIE-10 · Plan of care + orders · Attachments · Closure + signature) · Clinical Notes · Orders · Prescriptions · Patient Video Call · Chat Options · Settings (Profile, Digital Signature, Language, Messages, Change Password, Notification Preference).

**Not designed in Figma:** Nurse, Medical Coordinator, Office Manager, Marketing Manager, Fulfillment Manager, Super Admin. Consistent with **D-19 (addendum): MVP = 5 roles** (Patient, Physician, Coordinator, Office Manager, Super Admin); **Nurse/Marketing/Fulfillment = Phase 2**. → For those roles we build to the written journeys, and flag that pixel-level Figma fidelity is not yet possible (as the prompt requires me to flag).

## 3. Authoritative patient-experience changes (UCC_19 addendum — new vs. what's built)

1. **Guest-first booking, locked order:** Service ($75/$100/$175) → Who → When (10-min hold) → **Payment (pre-auth)** → **Intake + consent trio** → Confirmed (UCC-####, WhatsApp 30–60 min) → guest-only account upsell. *Payment precedes intake* (supersedes the current build's intake-first booking wizard).
2. **Commercial terms:** prices quoted **USD, charged COP at daily TRM** (receipt snapshots TRM); **$35 cancellation fee**; WhatsApp-confirm SLA 30–60 min (breach → OM SLA event).
3. **Home = ranked feed** (flagged result → consent-awaiting → next visit → lab quote → active case → booking tiles); 5-tab bottom nav (Home · Appointments · Records · Messages · Bill).
4. **Consent trio** at booking (treatment · Habeas Data · telehealth Res. 2654) + **point-of-care 9C** (pushed when doctor orders; blocks the procedure until signed) + **recording opt-in** in-call; 9B registry; guardian/witness fields; immutable rows.
5. **Auto-charge standing consent (9A)** toggle in Billing.
6. **Video visit = the only dark surface**; device-check → waiting room → in-call (timer, REC pill, Emergencia) → star rating.
7. **Locked lab loop:** results return to ordering physician **first**; flagged values released with the doctor's note on top; per-case **insurance export bundle** (record + invoices + universal claim form).
8. **Specialist booking** with per-specialist pricing shown before slot selection.
9. Chart field validations (chief complaint 10–150, HPI 50–1500, assessment 80–1200, ≥1 primary CIE-10, closure attestation) — the current build already enforces most of these.

## 4. Gap-check vs. the existing build (what carries forward as spec/logic)

The existing PR #1 build is the wrong *stack* but a strong *functional + visual* spec — the Doctor Figma is ~80% of what's already implemented (asterisk brand, top-nav, blue "Good Morning" hero, iconified KPI tiles, Patient Queue Accept/Decline, order-execution table, 12-step chart with hard-stops, priority tiers, quotes, invoicing, audit). **Carry forward as executable requirements:** the full REST surface, RBAC scoping, case state machine, chart hard-stops, quote→pay→dispatch loop, DIAN/adapter pattern, seed data, i18n dictionaries, and the design tokens (Speed Blue #384FD6 etc.). **Rebuild, don't port:** framework code (Bootstrap→Tailwind, Express-mono→TS services, Mongoose→Prisma/Postgres).

## 5. Recommended target architecture (if we proceed)

### 5.1 Monorepo (Turborepo/pnpm workspaces)
```
apps/
  web/                 React + TS + Vite + Tailwind (staff portals + public site, desktop-first)
  patient-mobile/      React Native + TS (Expo) — OR responsive PWA (see §6 question)
services/
  gateway/             Kong (declarative kong.yml) — routing, JWT verify, rate-limit
  auth-svc/            identity, sessions/JWT, RBAC, OTP, consent-signing keys
  patient-svc/         patients, dependents, profiles, consents (9A/9B/9C), records
  scheduling-svc/      providers, availability, slots+holds, bookings, cases, assignment
  clinical-svc/        12-step chart, orders, prescriptions, clinical notes, results
  billing-svc/         quotes, invoices, payments (gateway adapter), TRM, claim bundle
  comms-svc/           messages, notifications (WhatsApp/email/push), video tokens
  admin-svc/           users/roles, locations, settings, audit, CMS
packages/
  ui/ (design system)  tokens/, primitives, shared components
  types/               shared TS types + zod schemas
  config/              eslint/tsconfig/tailwind preset
infra/
  docker-compose.yml   web + every service + kong + postgres + (redis for queues)
```
### 5.2 Data ownership (Postgres — schema-per-service, one instance)
`auth` (users, roles, sessions) · `patient` (patients, dependents, consents) · `scheduling` (providers, availability, bookings, cases, appointments, intakes) · `clinical` (charts, orders, prescriptions, results, notes) · `billing` (quotes, invoices, payments, trm) · `comms` (messages, notifications) · `admin` (settings, audit, cms, catalog). Cross-service refs by id only; **no cross-schema joins** — services call each other's APIs or subscribe to events. Prisma schema + migrations per service.
### 5.3 Kong routing (edge)
`/api/auth/*→auth-svc` · `/api/patients/*→patient-svc` · `/api/scheduling/*→scheduling-svc` · `/api/clinical/*→clinical-svc` · `/api/billing/*→billing-svc` · `/api/comms/*→comms-svc` · `/api/admin/*→admin-svc`. Kong plugins: JWT (verify at edge), rate-limiting (tight on auth), CORS, request-size, correlation-id. Fine-grained RBAC stays **inside** each service (Kong does coarse auth only).
### 5.4 Cross-cutting
JWT (short-lived access + refresh) issued by auth-svc; services verify signature + claims. Inter-service: REST for queries, a light event bus (Redis streams / NATS) for journey events (booked, chart-sealed, result-ready) driving notifications + automation. Env-based config per service (`.env.example` each). Structured logs w/ correlation ids, no PII. Zod validation at every boundary. Tests: Vitest/Jest unit on auth/booking/RBAC per service + Playwright on the golden patient path.

## 6. The "how" — options, with a recommendation

The stack is mandated; the **delivery shape** is where judgment matters. Building 7 microservices + Kong + Docker + Prisma + a mobile app + a web app + a public site to production polish is a multi-week program.

- **Option A — Full microservices day 1 (literal reading).** 7 services + Kong + event bus from the start. *Pro:* matches the letter of the prompt. *Con:* highest upfront cost, most moving parts before a single screen works; easy to stall.
- **Option B — Modular monolith → split (pragmatic).** One TS backend organized as the 7 modules above with clean boundaries + Prisma schema-per-module, fronted by Kong, containerized — then extract hot modules into standalone services. *Pro:* fastest to a working, demoable, containerized product on the exact mandated tech (TS/Tailwind/Kong/Postgres/Prisma/Docker); boundaries are real so extraction is mechanical. *Con:* not "true" microservices on day 1.
- **Option C — Recommended: phased microservices.** Start with **3 services split on the real seams** — `auth-svc`, `core-svc` (patient+scheduling+clinical+billing), `comms-svc` — behind Kong in Docker from commit 1, with the module boundaries already drawn so `core` splits into patient/scheduling/clinical/billing as each stabilizes. Delivers the mandated topology (gateway + multiple services + Postgres/Prisma + Docker) **and** a working product early, then hardens toward full decomposition. *This is what I'd take to a client.*

## 7. Proposed phased build order (post-approval)
0. Repo scaffold: monorepo, Tailwind design-system package (tokens from brand book), Docker Compose (Kong + Postgres + web + 3 services), CI/lint/format. → demoable "hello, gateway".
1. **auth-svc + RBAC** + web login/register/OTP/forgot (the 8-role model, 5 active for MVP).
2. **Data model + Prisma migrations + seed** across schemas (port the existing Mongo domain model).
3. **Patient guest-first booking + payment + intake + consents** (mobile app or PWA) — the headline flow.
4. **Doctor web portal** — dashboard, queue, 12-step chart, orders, prescriptions, video (pixel-match Figma).
5. **Coordinator + billing loop** (quote→pay→dispatch, lab loop, claim bundle).
6. **Office Manager + Super Admin** (oversight, audit, config, CMS).
7. Public marketing site (rebuild existing on new stack; add anything new from urgentcarecolombia.com).
8. Hardening: tests, a11y (WCAG AA), i18n EN/ES, security pass, observability, deploy guide.
Nurse/Marketing/Fulfillment = **Phase 2** (D-19).

## 8. Open questions blocking a clean start (need your call)
1. **Stack pivot — confirm.** Proceed with the full re-platform (new stack, discard most of the current MongoDB/Bootstrap build), keeping the existing build only as functional/visual spec? This overrides the locked `CLAUDE.md` — I'll update it if you confirm.
2. **Where does the new code live?** New top-level structure on this same repo (recommended — keep history + docs), a fresh branch, or a new repo?
3. **Delivery shape:** Option A / B / **C (recommended)** from §6?
4. **Patient mobile:** true **React Native (Expo)** app, or a **mobile-first responsive PWA** in the web app? (The Figma is mobile; the prompt says React + TS + Tailwind for frontend and React Native isn't named — RN + Tailwind = NativeWind. This changes scaffolding materially.)
5. **Roles scope:** confirm **5-role MVP** (D-19) vs. the earlier all-8-Phase-1 directive.
6. **Payment/WhatsApp/video/DIAN vendors** remain Phase-0 decisions (adapters + mocks) unless you've since chosen — confirm.

**No code will be generated until you answer §8.1–8.4 (at minimum).**
