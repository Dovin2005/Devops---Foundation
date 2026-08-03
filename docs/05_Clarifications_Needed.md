# UCC — Clarifications Needed (Phase-0 Blockers)

Per Master Prompt §9.3, these decisions are architecturally significant or irreversible. The surrounding flows are **built with clean adapter interfaces and mock providers**, so the real choice can be slotted in without rework. Confirmation is required before go-live.

| # | Decision | Why blocking | Built in the meantime |
|---|----------|--------------|----------------------|
| B-01 | **Payment gateway** — Wompi vs Place to Pay vs PayU vs Stripe (D-11: Colombia PSE/Nequi/cards + international patients) | PCI tokenization design, webhooks, settlement currency | `PaymentAdapter` interface (`preauth`, `capture`, `refund`, `tokenizeCard`, webhook verify) + `MockPaymentAdapter`; saved-card one-click pay works end-to-end in demo mode |
| B-02 | **WhatsApp Business API provider** (Q2) — Meta Cloud API direct vs Twilio vs 360dialog; MVP integration level | BSP verification lead time; template pre-approval; shared-inbox model | `WhatsAppAdapter` (send template/session message, inbound webhook) + mock; all WhatsApp notification triggers already routed through it; comms logged to case threads |
| B-03 | **Telehealth video vendor** (D-18) — Twilio Video vs Daily vs Vonage | SDK choice affects both web and mobile clients | `VideoAdapter` (`createRoom`, `issueToken`, event webhook) + mock room UI (waiting room + in-call screens) |
| B-04 | **DIAN e-invoicing provider** (D-10) — authorized technology provider selection | CUFE generation must come from an authorized provider | `EInvoiceAdapter` (`issue`, `void`) + mock generating placeholder CUFE/CUV |
| B-05 | **Google Ads account linkage** (conversion export) | Requires client's Ads account, OAuth, conversion actions | `AdsExportAdapter` + mock; attribution capture (UTM/GCLID) fully implemented and stored |
| B-06 | **Data retention confirmation by counsel** (Q11, Compliance §3) | Legal exposure | Defaults per A-09, configurable |
| B-07 | **RIPS export template** — scope doc: "Will provide template" | Ministry format needed | Stub CSV/JSON export behind `rips.enabled` flag |
| B-08 | **Nurse compensation rates & payout rails** (Q18) | Contractual | Rate fields in procedure catalog + earnings report export |

**None of these block using the platform in demo/UAT mode** — all adapters ship with working mocks and the flows are complete.
