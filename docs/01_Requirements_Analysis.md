# UCC — Requirements Analysis (Build Baseline)

**Source precedence applied:** Master Build Prompt v2.0 → `UCC_Requirements_Scope_Flow-v1.0.docx` → UCC documentation package (`ucc_package/docs/`) → `UCC_Platform_Mockup.html` → screenshots → `BrandBook.pdf` (visuals only).

## 1. Product definition

Urgent Care Colombia (UCC) is a Colombian multi-city (Medellín, Cartagena, Bogotá) care platform with direct patient billing in COP, three parallel tracks:

1. **Patient Care Journey** — 12-stage flow: Acquisition (UTM/GCLID) → Booking (in-office / telehealth / at-home, multi-patient multi-service, slot lock, pre-auth) → Intake & round-robin coordinator assignment → Physician case acceptance (accept/decline window, auto-reassign) → Pre-consultation history review → Digital consent by category → 12-step guided clinical chart (hard-stops at steps 1, 2, 9, 12) → Order generation (5-tier priority red→blue) → Coordinator order coordination (AI-assisted OCR quoting from price catalog) → Execution (labs / imaging / nurse dispatch Uber-style / specialist) → Results & follow-up (critical-result alerts) → Billing & closure (auto COP invoice, one-click pay, sealed audit log).
2. **Wholesale / Fulfillment Track** — unique signup links → buyer registration (legal entity, RUT) → Super Admin approval → catalog/cart/checkout → real-time order alerts → pick-pack-dispatch → auto-invoicing → tracking → incident logging. **Plus prescription dispensing** (Pharmacy folded into Fulfillment per Master Prompt §2).
3. **Marketing Automation Track** — trigger-based sequences with delays/branching; channels in-app, WhatsApp, email, push (SMS future); full attribution (UTM set, GCLID, referral URL, landing page, device); Google Ads bidirectional conversion export; retention/reactivation; opt-in consent + suppression lists.

## 2. Canonical roles & portal routes (exactly eight)

| # | Role | Route | Phase |
|---|------|-------|-------|
| 1 | Patient | `/patient` | 1 |
| 2 | Physician (GP & Specialist) | `/physician` | 1 |
| 3 | Medical Coordinator | `/coordinator` | 1 |
| 4 | Office Manager / Supervisor | `/office-manager` | 1 |
| 5 | Super Admin / Managing Director | `/super-admin` | 1 |
| 6 | Marketing Manager | `/marketing` | 1 |
| 7 | Fulfillment Manager (incl. dispensing) | `/fulfillment` | 1 |
| 8 | Nurse (Contracted Clinician) | `/nurse` | 1 |

No Receptionist / Front Desk / Billing / Laboratory / Radiology / Pharmacy / Clinic Admin roles. Separate UCC-branded login per portal route. CMS owned by Office Manager; Marketing has execution access.

## 3. Screen inventory (from prototype, Phase-gated per Master Prompt §3)

- **Patient:** Dashboard · Appointments · Medical Records · Prescriptions · Bills · Insurance · Messages · Notifications · Profile
- **Physician:** Dashboard · Calendar · Patient Queue · Consultation (12-step chart) · Clinical Notes · Prescription · Orders · Reports (RIPS export)
- **Coordinator:** Dashboard · Order Coordination · Claims & Copay · Scheduling · Patient Follow-up · Communications
- **Office Manager:** Dashboard · User Management · Provider Management · Billing · Reports · CMS
- **Super Admin:** Multi-Clinic Management · Role Configuration · Platform Configuration · Audit Logs · Analytics
- **Marketing:** Dashboard · Campaign Builder · Segments · Attribution · Analytics
- **Fulfillment:** Dashboard · Buyers · Catalog · Warehouse · Dispensing Queue · Inventory · Supplier Orders · Reports
- **Nurse:** Working Preferences · Dashboard · Dispatch Inbox · Active Job · Procedure Doc · Earnings
- **Public site:** Home · About · Services · Locations · Telehealth · Contact · FAQs · Careers (CMS-managed, ES/EN)
- **Auth:** Sign Up · Login · Forgot · OTP · Reset — per-role login portals

## 4. The 12-step guided clinical chart (validation rules)

1. Informed consent — **hard-stop** · 2. Patient identification — **hard-stop** · 3. Past medical history (allergies, medications) · 4. Chief complaint (10–150 chars) · 5. HPI (50–1500 chars) · 6. Review of systems · 7. Physical exam + vitals · 8. Assessment (80–1200 chars) · 9. ICD-10/CIE-10 — **hard-stop**, ≥1 primary · 10. Plan of care + orders · 11. Attachments · 12. Closure + signature — **hard-stop**, seals chart immutably. Corrections after sealing require a signed, audited addendum.

## 5. Order priority tiers

Red = Immediate (act now) · Orange = Very urgent (same-day) · Yellow = Medium (48h) · Green = Schedulable · Blue = Elective.

## 6. Cross-cutting requirements

- **Audit:** every create/edit/export logged (user, ts, session/device, before/after); exports require justification; sealed charts immutable.
- **RBAC:** least privilege, row-level scoping (own / assigned-case / location / all). Marketing: no clinical data. Fulfillment: no PHI. Coordinators: no bulk export.
- **Comms:** in-app, WhatsApp shared inbox, email, phone log, live chat; threaded per case; internal notes hidden from patients.
- **Performance:** <3s dashboards, fast search, real-time refresh, autosave/session recovery.
- **Security:** JWT, encrypted sessions, timeouts, device tracking, optional 2FA (mandatory for Super Admin/Office Manager — D-16), PCI tokenization via gateway adapter.
- **Compliance:** Habeas Data Ley 1581/2012, telehealth Res. 2654/2019, CIE-10 + CUPS coding (D-09), DIAN factura electrónica CUFE (D-10), patient ID types CC/CE/TI/PA/PEP-PPT/NIT (D-12), retention 5+10 years, FHIR-ready model (D-14).
- **Bilingual:** Patient portal + patient-facing output fully ES/EN with per-document language control; staff portals i18n-framework with Spanish default (Master Prompt §8).
- **Branding:** "Urgent Care Colombia" everywhere; spelling *Colombia*; Brand Book visuals; palette Speed Blue `#384FD6`, Midnight Gray `#212124`, Human Feel `#F9F0D9` (corrected hex), Health Green `#00C08B`, Full Heart `#FF8078`, Yellow Vibes `#FFB100`; Montserrat primary, Playfair Display editorial-only.
- **Navigation:** top horizontal nav per reference screenshots (Master Prompt §7 voids the mockup's left-sidebar), preserving the prototype's module hierarchy.

## 7. Technology stack (mandated)

React.js + heavily customized Bootstrap design system (web) · React Native (mobile) · Node.js + Express (shared backend, versioned REST, JWT, RBAC, Swagger) · MongoDB (shared).

## 8. Phase gating

All eight roles ship Phase 1 MVP scope per the v1.0 rollout table (Master Prompt §3 supersedes the docs package's five-role MVP). Phase 1.5/2 items (AI diagnostics, predictive analytics, voice dictation, GPS tracking, procurement integrations, RIPS as 1.5 fast-follow, firma digital upgrade) are architected for (feature flags, adapters, schema fields) but **not built** — see `10_Future_Enhancements.md`.
