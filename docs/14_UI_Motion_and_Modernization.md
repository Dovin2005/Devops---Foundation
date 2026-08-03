# UCC — Modern UI: Motion, Loaders & Modernization Pass

This documents the modernization pass and answers "what animations & transitions are highly used in modern apps" — with what UCC now uses and why.

## 1. Animations & transitions highly used in modern apps

| # | Pattern | Where it's used in the wild | Used in UCC? |
|---|---------|-----------------------------|--------------|
| 1 | **Fade-up on mount** (opacity + 8–12px translateY) | Linear, Vercel, Stripe dashboards | ✅ `.ucc-content > *` enters with `fade-up`; content lists |
| 2 | **Hover lift** (translateY -2/-3px + deeper shadow) | Framer, Stripe cards | ✅ cards, stat tiles, illustration cards, `.vr-btn` |
| 3 | **Scale/pop-in for modals & toasts** (0.96→1 + fade) | Raycast, Linear command palette | ✅ `.ucc-modal` (`pop-in`), payment success check |
| 4 | **Shimmer skeleton loaders** (moving gradient) | YouTube, LinkedIn, Facebook | ✅ `.skeleton` shimmer set in `Loading` |
| 5 | **Spinner / ring** for inline async | everywhere | ✅ `.ucc-spinner`, button busy states |
| 6 | **Micro-interactions on press** (active scale 0.98) | iOS, Material 3 | ✅ `.btn:active` |
| 7 | **Progress/stepper transitions** (wizard steps) | Stripe Checkout, Typeform | ✅ signup wizard step rail, OTP boxes focus |
| 8 | **Gradient/mesh backgrounds & animated blobs** | Framer, Linear marketing | ✅ hero mesh, auth pane mesh, portal content mesh |
| 9 | **Conic/donut & bar chart reveals** | Analytics dashboards | ✅ donut + bars (CSS, no libs) |
| 10 | **Pulse for live/recording indicators** | Zoom, Google Meet, WhatsApp | ✅ `.vr-live .rec` pulse in the video room |
| 11 | **Slide-in side panels / drawers** | Gmail, Notion | ◐ dropdowns (search, bell, profile, export) |
| 12 | **Focus ring glow on inputs** | Stripe, Tailwind UI | ✅ `.form-control:focus` 4px glow |
| 13 | **Count-up numbers, parallax, scroll-reveal** | marketing sites | ○ Deferred (public site uses static gradients; parallax not added for perf) |
| 14 | **Reduced-motion honoring** (`prefers-reduced-motion`) | accessibility baseline | ✅ global override disables animation |

Legend: ✅ implemented · ◐ partial · ○ not yet (documented for future).

**Guidance applied:** motion is expressive on the public site and auth, and **restrained** in clinical data-entry screens (chart, orders) — durations 80–350ms, easing `ease`/`ease-out`, never blocking input. All motion respects `prefers-reduced-motion`.

## 2. What this pass added

### Import / Export (was mostly non-functional → now working)
- **Export** (`web/src/lib/exporters.js`): CSV (Excel-friendly, BOM), JSON, and print-to-PDF (branded, "Save as PDF"). Wired into Patient **Bills** (invoice PDF + CSV), **Prescriptions** (bilingual PDF), Physician **Reports**, Office-Manager **Reports**, and **Super-Admin Audit** (justified export → CSV download).
- **Import** (`web/src/lib/importers.jsx`): client CSV parser + `<ImportButton>` with a downloadable template. Wired into the Fulfillment **device catalog** (`POST /wholesale/products/import`) and available for the service catalog (`POST /admin/catalog/import`). Both upsert by SKU / CUPS code and are audited.

### Payment flow (modern)
`web/src/components/PaymentModal.jsx`: gradient amount header, line items, saved-card selection **or** new-card entry (auto-formatting, PCI note), a processing spinner, a success screen with an animated check, and a **downloadable PDF receipt**. Card is tokenized via the gateway adapter — verified end-to-end (quote → `paid`, card saved as VISA ···· 4242).

### Video consultation (modern room)
`web/src/components/VideoRoom.jsx` at `/{patient|physician}/app/visit/:caseId`: **waiting room → connecting → live**, real self-view via `getUserMedia`, mic/cam toggles, screen-share & settings affordances, an end-call button, a live **recording-consent** banner (Res. 2654/2019), a call **timer**, and an in-call **chat rail**. "Join" buttons appear on telehealth appointments (patient calendar + list) and the physician calendar. Vendor SDK slots in behind `POST /video/token` (Phase-0 B-03).

### Modern calendar
`web/src/components/Calendar.jsx`: month grid with navigation + "Today", appointment **dots colored by modality**, and a selected-day agenda with a telehealth **Join**. Replaces the old static week/table views on the Patient and Physician calendars.

### Authentication (matches the prototype)
- **Password-strength meter** (`AuthBits.jsx`, mockup `.strength` bars) in the signup wizard and reset screen.
- **6-box OTP** entry with auto-advance & paste (mockup `.otp`).
- **Forgot → OTP → Reset** flow (`ForgotPassword.jsx`) for every portal, backed by mock `POST /auth/otp/request|verify`.
- Login/reset inputs now use **icon-prefixed fields**; auth brand pane has a richer gradient mesh.

### System-wide polish
- **Gradients**: `$grad-blue`, `$grad-mesh` tokens; hero cards, payment header, calendar selection, auth panes, portal content.
- **Modern fields**: leading-icon inputs, focus glow.
- **Loaders**: shimmer skeleton set + ring spinner replace the flat block.
- **Icons**: Lucide throughout (nav, fields, controls, statuses).
- **Global search / bell / profile** menus in the dark topbar (from the prior pass) retained.

## 2b. Guided patient forms (follow-up pass)

- **Booking wizard** (`web/src/portals/patient/BookingWizard.jsx`) — a 5-step guided flow replacing the old single form: **Who** (self / dependent avatars) → **Visit type** (icon choice cards with descriptions + COP price) → **When** (city, date-time with lock note, physician picker with "next available" or named doctor) → **Symptoms** (body-area chips, onset segmented control, 1–10 severity slider that shifts green→amber→red, fever / on-medication flags, guided description with hints, goals) → **Review & consent** (full summary + Habeas Data consent). Captures **structured intake** — new `Intake` fields `bodyAreas[]`, `onset`, `severity`, `hasFever`, `takingMedication` — so the physician arrives oriented.
- **Rich patient profile** (`PatientProfile`) — editable Identity & contact (phone, DOB, sex), **Colombian address** (department / city / street / neighbourhood), **health information** as add/remove **chip inputs** (allergies red, medications blue, conditions amber — type-and-Enter), document-language preference, **marketing opt-in** toggles per channel, inline **add-dependent** form, and the consent ledger. Every edit PATCHes and re-renders.

## 3. Verification (2026-07-08)
- 13/13 backend tests green.
- Preview-verified: Forgot→OTP→Reset (strength 4/4 "Fuerte"); payment card→processing→success + saved card persisted + quote `paid`; video room waiting→live with running timer + remote participant + chat; month calendar renders with agenda; product CSV import created a row; catalog shows Import + Export; top-nav Speed-Blue; no console errors.
- **Known env note:** `preview_screenshot` intermittently returns blank frames in this sandbox (getUserMedia permission + dark canvas); all checks above were verified via DOM/state and network calls.
