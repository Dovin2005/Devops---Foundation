# UCC — User & Administrator Guide

## Patients (`/patient`)

- **Register** with Habeas Data consent; marketing source (UTM/GCLID) is captured automatically.
- **Book** (Citas): choose in-office / telehealth / at-home, city, physician (or next available), date-time; the slot locks with payment pre-authorization. If someone takes the slot first you get a 409 message and keep your form data.
- **Intake** is submitted with the booking; a coordinator is auto-assigned (round-robin).
- **Bills**: review quotes sent by your coordinator → *Accept & pay* (one-click); invoices show DIAN CUFE and export to PDF; paid + completed orders close the case.
- **Records / Prescriptions**: bilingual output — set your document language (ES / EN / bilingual) in Profile.
- **Messages**: chat with your care team per case; **Insurance**: register EPS/Prepagada/Póliza coverage.

## Physicians (`/physician`)

- **Patient Queue**: accept or decline (with configurable reason — declining auto-reassigns the case).
- **Consultation**: 12-step guided chart. Steps 1, 2, 9, 12 are hard-stops; chief complaint 10–150 chars, HPI 50–1500, assessment 80–1200; at least one primary CIE-10 code. *Close & sign* seals the chart immutably; later corrections are signed addenda.
- **Orders**: issue lab / imaging / specialist / nurse procedure / therapy / follow-up / certificates with red→blue priority; they appear instantly in coordination.
- **Prescriptions**: drug-safety interaction alerts; bilingual PDF; controlled meds flag recetario oficial.
- **Reports**: order summaries; RIPS export (enabled in Phase 1.5 via feature flag).

## Coordinators (`/coordinator`)

- **Dashboard**: CRM view of assigned cases with journey stage (n/12).
- **Order Coordination**: select pending orders → *AI quote* (OCR + catalog + markup) → review → send. Quotes over the threshold need Office Manager review. On payment, nurse-procedure orders broadcast to nurses automatically.
- **Scheduling**: book home / in-clinic / external partner execution; upload results (critical results alert physician + supervisor automatically).
- **Follow-up**: task + SLA view; *Escalate overdue* pushes >24h-late tasks to the Office Manager.
- **Communications**: multi-channel case inbox (in-app/WhatsApp/email/phone/live chat); *internal* notes are never visible to patients.

## Office Managers (`/office-manager`)

Users (invite/suspend, location-scoped), Providers (credential approval — activation of unverified physicians requires Super Admin), Billing oversight, Inventory with QR check-in/out and low-stock flags, Reports, CMS (you own content; Marketing has execution access on marketing-scope entries).

## Super Admin (`/super-admin`)

Multi-clinic management, user administration (all roles), the role-permission matrix, **Platform Configuration** (every Decisions-Assumed default from docs/04 is editable here: concurrency caps, quote thresholds, dispatch timeouts, retention…), feature flags (RIPS, claims, advanced e-sign), audit trail with **justification-required export**, cross-city analytics, wholesale buyer approval.

## Marketing (`/marketing`)

Campaign builder (trigger → delay → channel → branch condition), segments, attribution table (UTM/GCLID → visits/conversions/revenue), *Export conversions → Google Ads*. All sends enforce opt-in consent and the suppression list; no clinical data is accessible.

## Fulfillment (`/fulfillment`)

Buyer invitations (unique signup links; activation gated on Super Admin approval), device catalog (SKU/price/stock/INVIMA notes), warehouse pick→pack→dispatch with auto shipment docs and auto-invoice, incident logging, **Dispensing** queue for prescriptions (controlled items flagged), inventory.

## Nurses (`/nurse`)

Dispatch inbox shows open broadcasts in your zones — patient first name, procedure, and time only; **address and instructions unlock when you accept** (first to accept wins). Travel status: en route → arrived → started. Procedure Doc records materials, tolerance, complications, and adverse events — any adverse event alerts the coordinator and physician immediately (severe also alerts the supervisor). Completion makes the visit compensation-eligible; see Earnings.
