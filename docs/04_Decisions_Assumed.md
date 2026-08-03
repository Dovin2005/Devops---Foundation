# UCC — Decisions Assumed Report

Per Master Prompt §9: decisions already recorded in `UCC_00c_Decisions_Register.docx` are applied as-is (D-01…D-18). Where the register leaves latitude or the 21-item "Decision Required" list is open, a safe, reversible default is implemented **behind configuration** and logged here. Architecturally blocking choices are NOT hard-wired — they sit behind adapter interfaces (see `05_Clarifications_Needed.md`).

| # | Decision | Default implemented | How to change | Rationale |
|---|----------|--------------------|---------------|-----------|
| A-01 | Coordinator max active-case concurrency (scope Q1) | **3** (configurable `assignment.maxActiveCases` in Platform Settings) | Super Admin → Platform Configuration | Mid-point of the 2/3/5 options in the scope doc |
| A-02 | Attribution model (Q4) | **Last-click** (`marketing.attributionModel`) | Platform Settings | Industry default; MP §9.2 example |
| A-03 | E-signature level (Q5 / D-13) | **Simple e-signature** (firma electrónica): typed/drawn capture + timestamp + hash; firma digital = 1.5 flag | Feature flag `esign.advanced` | D-13 baseline |
| A-04 | Escalation thresholds (Q6) | Follow-up overdue → Office Manager after **24h** past SLA; critical results alert coordinator + supervisor immediately (`sla.escalationHours`) | Platform Settings | Functional Spec §7.8 |
| A-05 | Inventory scanning (Q7) | **QR codes** (`inventory.scanMode`), barcode-ready field format | Platform Settings | Scope doc names QR first |
| A-06 | Nurse dispatch rules (Q8, Q17) | Concurrency **1 active job**/nurse; zone = city service area; re-broadcast timeout **10 min** (`dispatch.*`) | Platform Settings | Uber-style first-accept model |
| A-07 | Quote approval (Q9) | **Mandatory coordinator review** before send; quotes ≥ threshold (default 500,000 COP) flagged for OM review (`quotes.autoSend=false`, `quotes.reviewThreshold`) | Platform Settings | Conservative; Functional Spec 8.3 |
| A-08 | OM vs Super Admin boundary (Q10) | Per Approval & Permission Matrix: OM location-scoped full ops; SA-only: cross-location, pricing policy, role config, integrations, PHI-export approval, buyer approval, provider credential approval | Role Configuration screen | UCC_Approval_and_Permission_Matrix |
| A-09 | Retention (Q11) | Clinical 15y equivalent (5 active + 10 archive per UCC_14_15 "5+10"), audit logs 10y, comms logs 5y (`retention.*`) | Platform Settings; confirm with counsel | UCC_14_15 §1 audit note |
| A-10 | Wholesale onboarding docs (Q12) | Required: legal name, entity type, RUT, addresses, contact; optional uploads (registration cert, tax cert, gov authorization). Approval SLA 48h (`wholesale.approvalSlaHours`) | Platform Settings | Scope doc §7.2 |
| A-11 | Phase-1 catalogs (Q13, Q16) | Nursing procedures: IV therapy, injections, wound care, vitals, sample collection, medication administration (all six from Q16). Specialist types: General Medicine, Cardiology, Dermatology, Pediatrics + Other (mockup list) | Catalog management | Mockup + scope doc |
| A-12 | International patients without cédula (Q14 / D-12) | ID types CC/CE/TI/**PA (passport)**/PEP-PPT/NIT; optional at signup, required before payment/claim | Built-in | D-12 |
| A-13 | Telehealth documentation (Q15 / D-08) | Consent type `recording` + telehealth attestation stored on chart per Res. 2654/2019; forms configurable | CMS templates | D-08 |
| A-14 | Nurse compensation (Q18) | Per-service rate from procedure catalog; travel flat fee field; visible in Earnings; payout processing external (report export) (`nursePay.*`) | Platform Settings | Minimal reversible model |
| A-15 | Nurse visibility policy (Q19) | Before accept: first name, zone, procedure type, time window. After accept: full address, physician instructions, prep notes | Built-in | Scope doc Stage 10 |
| A-16 | Adverse event protocol (Q20) | Severity tiers mild/moderate/severe; alert chain coordinator → physician → supervisor (severe = all at once); required narrative + vitals; response SLA 30 min severe (`adverse.*`) | Platform Settings | Scope doc Stage 10 |
| A-17 | MFA (D-16) | Optional 2FA (TOTP-ready flag), **enforced=true for Super Admin & Office Manager** — dev seed keeps it off for demo logins | Platform Settings | D-16 assumption flagged |
| A-18 | SMS channel (D-17) | Deferred; channels = in-app / email / WhatsApp / push, all through the notification service with per-channel adapters | Adapter registry | D-17 |
| A-19 | Insurance/claims scope (C-06) | Colombian coverage records (EPS/Prepagada/Póliza/Particular), eligibility fields, copay on invoices, claim records with glosa/appeal status tracking. No clearinghouse integration | Feature flag `claims.enabled` | D-04 + MP §6 reconciliation |
| A-20 | Electronic invoicing (D-10) | Invoice model carries `cufe`, `cuv`, XML/PDF refs; DIAN provider behind `EInvoiceAdapter` (mock in dev) | Adapter | D-10 |
| A-21 | Slot hold TTL | **10 minutes** (`booking.slotHoldMinutes`) | Platform Settings | Functional Spec 8.1 hold window |
| A-22 | Currency & formats | COP formatted `$1.234.567 COP`, es-CO / en-US number & date conventions per locale | i18n layer | MP §8 |

Every default above is surfaced in **Super Admin → Platform Configuration** and stored in the `settings` collection so it can be changed without code.
