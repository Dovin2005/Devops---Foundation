# UCC — Repo Salvage Report

Both uploaded codebases are **reference material only** (Master Prompt §4). Neither is continued; the build is a clean React + Bootstrap / Node + Express / MongoDB implementation.

## 1. `UCC-Urgent-Care-Columbia-conflict_020726_0532` (Python FastAPI + React CRACO/Tailwind/shadcn)

**What it implemented** — a substantially complete FastAPI backend (`backend/server.py`, 44KB) against MongoDB (motor), with:
auth (register/OTP/login/forgot/reset, JWT), role metadata, hospitals, price catalog, medicines, chart-step metadata, patients + dependents, CMS content, global search, case lifecycle (list/get/accept/decline/status, physician queue), 12-step chart (get/save-step/seal), orders (create/list/status), quotes (AI quote stub, send, pay, promo validation), prescriptions, bookings/appointments, invoices (list/pay), video token stub, notifications, tasks, user management, providers, audit (list + justified export), campaigns, promos, inventory, wholesale, nurse jobs (list/accept), and per-role dashboard aggregation endpoints. `seed.py` (23KB) seeds demo data across all collections.

**Carried forward (as requirements/logic, re-implemented in Node/Express):**
- The complete REST resource map and endpoint naming (mirrors the documented API map in UCC_14_15).
- Case state machine + accept/decline with reason + re-assignment behaviour.
- Chart step save/seal flow with hard-stop enforcement and audit on seal.
- Justified audit export pattern; audit-on-mutation decorator pattern.
- Quote → send → pay flow with promo validation.
- Role-scoped data filtering (`_scope_cases`) and per-role dashboard aggregations.
- Seed data shapes (hospitals in the three cities, catalog, medicines, demo users per role).

**Discarded:** Python/FastAPI stack, CRACO/Tailwind/shadcn frontend, "Columbia" spelling artifacts, emergent.sh scaffolding, its visual design.

## 2. `ucc_web_app` (Next.js 14 + TypeScript + Tailwind + Prisma/NextAuth)

**What it implemented** — an early scaffold: NextAuth credential auth, Prisma (PostgreSQL) schema for users/roles, per-role login slugs, role→sidebar config (`lib/role-config.ts`), S3 upload helper, theme toggle, seed script. Very little domain functionality.

**Carried forward:**
- Per-role login-slug → role-enum mapping idea (re-expressed as the eight canonical portal routes).
- Brand color usage confirming Speed Blue `#384FD6` as primary.

**Discarded:** Next.js/Prisma/Postgres stack; its 7-role model with `ADMIN` labelled "Office Manager" and `COORDINATOR` labelled **"Front Desk"** (violates canonical roles); missing Office Manager/Super Admin split; Tailwind styling.

## 3. Net effect

The Node backend re-implements the FastAPI surface 1:1 where it matched the docs, extends it where the docs demand more (consents, insurance/coverage, claims, dispensing, campaigns/segments/attribution, CMS ownership rules, feature flags, settings), and drops nothing documented. No code was copied; logic was treated as executable requirements.
