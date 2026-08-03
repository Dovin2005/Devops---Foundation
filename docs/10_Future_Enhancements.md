# UCC — Future Enhancements Backlog (Phase 1.5 / Phase 2)

Architected for (feature flags, adapters, schema fields exist) but **not built** in Phase 1, per Master Prompt §3. Source: v1.0 rollout table + docs package.

## Phase 1.5 (fast-follow / hardening)

| Item | Where it plugs in |
|---|---|
| RIPS / Ministry export (template pending — B-07) | `rips.enabled` flag; `/admin/rips/export` stub |
| Firma digital (CA-backed signature) upgrade (D-13) | `esign.advanced` flag; consent + chart signature objects |
| Full AI-assisted OCR pricing (real OCR service) | `ocr` adapter (mock returns deterministic extraction today) |
| Physician provider catalog, specialist interconsult, sedation module | Physician portal routes reserved |
| Advanced KPI/SLA analytics, satisfaction trends, coaching alerts (OM) | Dashboard aggregation service |
| Workflow templates & automated surveys (coordinator) | Campaign trigger `review_request` already fires |
| Inventory forecasting, delivery ETA, restock alerts (fulfillment) | `reorderLevel` fields + movements history |
| Reactivation/ROI dashboards, smart segmentation (marketing) | Segment rules engine |
| GPS tracking, route optimization, photo uploads, earnings dashboard v2 (nurse) | `nurseJobs.visit` schema extensible |

## Phase 2

AI diagnostic suggestions (`ai.diagnostics` flag — never on in MVP), predictive analytics & staffing, voice dictation/transcription, full WhatsApp Business API automation + AI response assistance, smart case routing, procurement integrations & multi-warehouse, AI campaign/budget optimization + multi-touch attribution, smart nurse matching + live location sharing, SMS channel (D-17), IHCE/RDA interoperability rollout (FHIR-ready model shipped in Phase 1), enhanced interoperability for patients.

## Deferred by explicit decision

- US insurance claims processing / clearinghouses — out of platform scope (MP §6); Colombian coverage + claim/glosa tracking shipped behind `claims.enabled`.
- Roles beyond the canonical eight — prohibited (MP §2).
