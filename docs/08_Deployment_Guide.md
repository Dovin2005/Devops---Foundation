# UCC — Deployment Guide & Environment Configuration

## Prerequisites

- Node.js ≥ 20 LTS
- MongoDB ≥ 6 (Atlas or self-hosted). In development the backend runs an **embedded in-memory MongoDB** automatically when `MONGODB_URI` is empty — no local install needed (data resets on restart).

## Local development

```bash
# API (port 5000) — seeds demo data on first boot with an empty DB
cd backend
npm install
npm run dev          # http://localhost:5000 · Swagger: /api/docs

# Web (port 5173, proxies /api → :5000)
cd ../web
npm install
npm run dev          # http://localhost:5173
```

### Demo logins (password for all: `Demo123!`)

| Portal | Route | Email |
|---|---|---|
| Patient | `/patient` | maria@demo.ucc.co |
| Physician (GP) | `/physician` | andres@demo.ucc.co |
| Physician (Specialist) | `/physician` | castro@demo.ucc.co |
| Coordinator | `/coordinator` | ana@demo.ucc.co |
| Office Manager | `/office-manager` | sofia@demo.ucc.co |
| Super Admin | `/super-admin` | daniel@demo.ucc.co |
| Marketing | `/marketing` | carolina@demo.ucc.co |
| Fulfillment | `/fulfillment` | javier@demo.ucc.co |
| Nurse | `/nurse` | laura@demo.ucc.co |

## Environment variables (backend/.env)

| Var | Default | Notes |
|---|---|---|
| `MONGODB_URI` | *(empty → embedded dev DB)* | Production: MongoDB Atlas connection string (Colombia/LatAm residency per compliance §3) |
| `PORT` | 5000 | |
| `JWT_SECRET` | dev value | **Must** be a strong secret in production |
| `JWT_EXPIRES` | 8h | Session timeout requirement |
| `CORS_ORIGIN` | http://localhost:5173 | Comma-separated allowed origins |
| `PAYMENT_PROVIDER` | mock | Slot in Wompi / Place to Pay adapter (B-01) |
| `WHATSAPP_PROVIDER` | mock | Slot in Business API provider (B-02) |
| `VIDEO_PROVIDER` | mock | Slot in Twilio/Daily/Vonage (B-03) |
| `EINVOICE_PROVIDER` | mock | DIAN authorized provider (B-04) |

## Production build

```bash
cd web && npm run build      # outputs web/dist — serve via CDN/nginx
cd backend && npm start      # run behind a reverse proxy (TLS terminated)
```

Recommended topology: nginx (TLS, gzip, static `web/dist`) → Node API (pm2/systemd or container) → MongoDB Atlas replica set. Enable MongoDB backups; audit collection is append-only — retention 5+10 years (A-09).

## Tests

```bash
cd backend && npm test       # 13 API tests: auth, RBAC, chart hard-stops,
                             # quotes/pay, dispatch, adverse events, audit export
```

## Go-live checklist (Phase-0 blockers — docs/05)

1. Select and wire payment gateway adapter (PCI tokenization).
2. WhatsApp Business API verification (long lead time — start early).
3. Telehealth video vendor + SDK keys (web & mobile).
4. DIAN e-invoicing provider credentials.
5. Google Ads account link + conversion actions.
6. Counsel sign-off on retention policies; RIPS template from Ministry.
7. Rotate `JWT_SECRET`; set real MFA enforcement for Super Admin/OM (A-17).
8. Re-seed production with real catalogs (CUPS pricing) and locations.
