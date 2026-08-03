# UCC — Test Suite & Manual QA Checklist

## Automated (backend/tests/api.test.js — 13 tests, all passing)

- Health endpoint; per-portal login blocks wrong roles; `/auth/me` profile.
- RBAC: marketing denied patient records; per-role dashboard payloads.
- Clinical: case list carries journey stage; sealing blocked with unmet hard-stops (422); chief-complaint 10–150 char validation (400); sealed chart rejects edits (409) but accepts addenda.
- Billing/dispatch: patient pays sent quote → orders paid; nurse dispatch first-accept-wins (409 on second accept), address hidden pre-accept, revealed post-accept; visit documentation with adverse event → compensation eligible; audit export refused without justification (422), succeeds with it.

Run: `cd backend && npm test`

## Manual QA — golden path (verified in browser 2026-07-02)

1. ✅ Public landing renders (ES default, EN toggle, 8 portal links, attribution capture posts on UTM/GCLID).
2. ✅ Patient login (`maria@demo.ucc.co`) → dashboard: KPI cards, top-nav (9 screens), unread notification badge, COP formatting (`$ 95.000`).
3. ✅ Physician login → Consultation: case list with stage badge (8/12), 12-step rail (12 steps, 4 hard-stop markers), sealed chart shows addendum-only mode.
4. Booking flow: new visit → slot lock (double-book returns 409 with friendly message) → intake → coordinator round-robin.
5. Physician queue: accept; decline → auto-reassign with reason logged.
6. Coordinator: select orders → AI quote → send (threshold ⇒ OM review) → patient pays → nurse job broadcast.
7. Nurse: accept (address unlocks) → en route → arrived → started → document (adverse event alerts) → earnings update.
8. Coordinator uploads result; critical flag alerts physician + coordinator + OM.
9. Invoice generation (CUFE present) → one-click pay → case closes when orders complete.
10. Super Admin: settings edit audited; audit export requires justification; buyer approval gate.
11. Fulfillment: invite link → (public signup endpoint) → SA approves → order → pick→pack→dispatch docs → incident log; dispensing queue transitions.
12. Marketing: campaign activate/run honors suppression; attribution table; Ads export.
13. i18n: ES/EN switch on every shell; patient document-language control (ES/EN/bilingual).
14. Responsive: top-nav wraps at ≤768px; auth split-pane collapses ≤900px.

## Non-functional spot-checks

- Dashboards return in a single API call (<3s target).
- Rate limiting (300 req/min/IP) returns 429 beyond burst.
- JWT expiry (8h) forces re-login; suspended users blocked with clear message.
