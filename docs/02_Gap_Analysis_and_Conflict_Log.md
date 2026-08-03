# UCC — Gap Analysis & Conflict Log

Conflicts found between sources, and the resolution applied under the Master Prompt v2.0 precedence order.

## Conflict log

| # | Conflict | Sources | Resolution applied | Authority |
|---|----------|---------|--------------------|-----------|
| C-01 | Brand name: "Urgent Care Express" vs "Columbia" vs "Colombia" | BrandBook vs repo names vs scope doc | **Urgent Care Colombia (UCC)** everywhere; Brand Book visuals retained | MP §1 |
| C-02 | Human Feel hex listed as broken `#z` | BrandBook | **`#F9F0D9`** (from RGB 249,240,217) | MP §1 |
| C-03 | Phase scope: v1.0 Tab 2 + docs package define a 5-role MVP (Nurse/Marketing/Fulfillment = Phase 2); v1.0 Tab 1 rollout table gives all 8 roles Phase 1 scope | Scope doc Tab 1 vs Tab 2; Functional Spec §1; Decisions Register D-07 | **All eight roles built at Phase 1 MVP scope** per the v1.0 rollout table | MP §3 (explicit supersession of prototype Phase-2 flags and D-07) |
| C-04 | Pharmacy portal exists in prototype as a ninth portal | Mockup `PORTALS.pharmacy` | Dispensing Queue / Inventory / Supplier Orders / Reports **folded into `/fulfillment`** | MP §2 |
| C-05 | Navigation: mockup uses left sidebar; screenshots show top horizontal nav | Mockup §4.3 vs screenshots | **Top-nav pattern**; module hierarchy preserved | MP §7 |
| C-06 | Insurance/claims: MP §6 excludes *US* insurance claims processing; prototype has Patient·Insurance and Coordinator·Claims & Copay; D-04 says build payer/eligibility/copay/claims | MP vs mockup vs Decisions Register | Colombian coverage model (EPS/Prepagada/Póliza/Particular) + claim/glosa tracking **kept** (prototype fidelity §6.5); no US-style clearinghouse processing | MP §6 + §6.5; logged in Decisions Assumed |
| C-07 | Database: docs package specifies PostgreSQL relational core; MP mandates MongoDB | UCC_14_15 vs MP §5 | **MongoDB** (mandated); entity model preserved as Mongoose schemas, FHIR-ready field alignment retained | MP §5 |
| C-08 | Portal routes: docs use `/app/{role}` and `/app/office`, `/app/admin`; MP mandates `/patient` … `/office-manager`, `/super-admin` | Functional Spec §3 vs MP §2 | **MP route table** used verbatim | MP §2 |
| C-09 | Patient menu label "Billing" vs "Bills" | Screenshots/mockup vs D-15 | Menu **"Bills"**, action "Pay Bill" (D-15) — prototype already uses "Bills" | Decisions Register D-15 |
| C-10 | Roles named ADMIN/"Front Desk" in ucc_web_app; Receptionist-like flows in reference repos | Reference repos | Discarded; canonical 8-role enum only | MP §2, §4 |
| C-11 | Timeline: client 3-month target vs Delivery Plan 14–16 weeks | Scope doc vs Functional Spec §9.4 | No code impact; noted for planning | — |
| C-12 | HPI/Chief-complaint step order differs between Tab 1 Stage-7 text (PMH before CC) and Functional Spec chart table (CC step 4 before HPI) | Scope doc vs Functional Spec | Functional Spec order used: 1 Consent, 2 ID, 3 PMH, 4 CC, 5 HPI, 6 ROS, 7 Exam+Vitals, 8 Assessment, 9 Dx, 10 Plan, 11 Attachments, 12 Signature — matches mockup `STEPBODY` | Prototype fidelity |

## Gap analysis (spec → build)

Gaps identified in the sources that the build closes (per Functional Spec §9 recommendations):

| Gap | Disposition in this build |
|-----|---------------------------|
| Physician decline → re-route screen missing | Built: decline with reason auto-reassigns earliest-available physician |
| Patient quote-review/acceptance screen missing | Built: quote appears in Patient Bills with Accept & Pay |
| Versioned consents per encounter type | Built: consent records carry type + version + timestamp |
| Results-review & follow-up screen distinct from records | Built: results feed on dashboards + orders detail |
| Telehealth waiting room / in-call screens | Built as UI with mock video adapter (vendor = Phase-0 decision D-18) |
| Empty/error states for queues and inboxes | Built into shared components |
| Case stage (1–12) visible on every role's case view | Built: stage badge on case rows/detail |
| Combined coordinator task + SLA view | Built: Follow-up screen with overdue flags |
| RIPS export | Stub export behind feature flag (1.5 fast-follow per Functional Spec §6) |

## Items not built (Phase 1.5 / 2 — architected only)

AI diagnostic suggestions, predictive analytics, voice dictation, GPS tracking & route optimization, procurement integrations, advanced warehouse analytics, firma digital (CA-backed) upgrade, SMS channel (D-17), full WhatsApp Business API integration (adapter + mock in place), Google Ads live export (adapter + mock). See `10_Future_Enhancements.md`.
