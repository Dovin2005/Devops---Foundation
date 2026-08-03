# Patient Authentication API

Covers the patient-facing authentication endpoints: Register, Login, Logout, Verify OTP,
Resend OTP, Forgot Password — Contact Options, Forgot Password, and Reset Password. Served by
`auth-service` (`services/auth-service/src/routes/auth.routes.ts`).

**Base path:** `/api/auth` — via the Kong gateway (e.g. `http://localhost:5000/api/auth/...`)
or directly against auth-service in local dev (`http://localhost:4001/api/auth/...`). None of
these routes require a bearer token except **Logout**.

**Standard error shape** (all endpoints):

```json
{ "error": "Human-readable message" }
```

Validation failures (400) instead return:

```json
{ "error": "Validation failed", "issues": [{ "path": "email", "message": "Invalid email" }] }
```

**Rate limiting:** Register, Verify OTP, Resend OTP, Forgot Password, and Reset Password are
all limited to **5 requests per 15 minutes**, keyed by `IP + email/identifier`. Exceeding it
returns:

```
429 Too Many Requests
{ "error": "Too many requests — please wait before trying again" }
```

---

## 1. Register

Public self-registration. **Patient only** — the account starts as `pending_verification` and
issues no tokens; the flow only completes via **Verify OTP** (`purpose: "registration"`).

| | |
|---|---|
| **Method / Path** | `POST /api/auth/register` |
| **Auth** | None |

### Request Body

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string (email) | ✅ | |
| `password` | string | ✅ | min 8 chars |
| `confirmPassword` | string | ✅ | must match `password` |
| `firstName` | string | ✅ | |
| `lastName` | string | ✅ | |
| `phone` | string | | |
| `city` | enum | | `"Medellín" \| "Cartagena" \| "Bogotá"` |
| `language` | enum | | `"es" \| "en" \| "bilingual"` |
| `dob` | string (date) | | `YYYY-MM-DD` |
| `idType` | enum | | `"CC" \| "CE" \| "TI" \| "PA" \| "PEP-PPT" \| "NIT"` |
| `idNumber` | string | | |
| `address`, `neighborhood`, `country` | string | | |
| `emergencyContactName`, `emergencyContactPhone`, `emergencyContactRelationship` | string | | |
| `familyMembers` | array | | `[{ "fullName": string, "relationship": string }]` |
| `consents` | array of enum | | consent types signed at registration (e.g. `treatment`, `data_privacy`) |
| `otpChannel` | enum | | `"email" \| "sms"` — which channel gets the verification code (defaults to the platform's configured default channel) |

### Sample Request

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "camila.vargas@example.com",
  "password": "Str0ng!Pass",
  "confirmPassword": "Str0ng!Pass",
  "firstName": "Camila",
  "lastName": "Vargas",
  "phone": "+57 300 000 0000",
  "city": "Medellín",
  "idType": "CC",
  "idNumber": "1029384756",
  "consents": ["data_privacy", "treatment"],
  "otpChannel": "email"
}
```

### Success Response

`201 Created`

```json
{
  "userId": "b3f1c2a0-...-uuid",
  "otpSentVia": "email"
}
```

### Error Responses

| Status | Body `error` | Condition |
|---|---|---|
| 400 | `Validation failed` | schema violation (e.g. passwords don't match) |
| 409 | `An account with this email already exists` | |
| 409 | `An account with this phone number already exists` | |
| 400 | `No phone number on file — choose email instead` | `otpChannel: "sms"` but no `phone` given |
| 502 | `Could not complete registration — please try again` | core-service failed to create the patient profile (user row is rolled back) |
| 502 | `Could not send a verification code — please try registering again` | notification-service unreachable (user row is rolled back) |
| 429 | rate limited | see above |

---

## 2. Login

Dedicated patient login endpoint (role is implied by the URL, not sent in the body).

| | |
|---|---|
| **Method / Path** | `POST /api/auth/login/patient` |
| **Auth** | None |

### Request Body

| Field | Type | Required |
|---|---|---|
| `email` | string (email) | ✅ |
| `password` | string | ✅ |

### Sample Request

```http
POST /api/auth/login/patient
Content-Type: application/json

{ "email": "maria@demo.ucc.co", "password": "Demo123!" }
```

### Success Response

`200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "5f9e...-uuid",
    "role": "patient",
    "email": "maria@demo.ucc.co",
    "firstName": "María",
    "lastName": "Ríos",
    "name": "María Ríos",
    "phone": null,
    "city": "Medellín",
    "status": "active",
    "languagePref": "es",
    "patientId": "a71c...-uuid",
    "locationId": null
  }
}
```

- `token` — access JWT, expires in **15 minutes** (`ACCESS_TTL`), issuer `ucc-auth`.
- `refreshToken` — expires in **7 days** (`REFRESH_TTL`).

### Error Responses

| Status | Body `error` | Condition |
|---|---|---|
| 400 | `Validation failed` | malformed email/empty password |
| 401 | `Invalid credentials` | unknown email, wrong password, or account isn't a `patient` |
| 403 | `Account suspended — contact your administrator` | |
| 403 | `Please verify your account with the code we sent you before logging in` | account is still `pending_verification` |

---

## 3. Logout

Revokes **all** active refresh tokens for the caller (all sessions, not just the current
device).

| | |
|---|---|
| **Method / Path** | `POST /api/auth/logout` |
| **Auth** | **Required** — `Authorization: Bearer <access_token>` |

### Request Body

None.

### Sample Request

```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Success Response

`200 OK`

```json
{ "ok": true }
```

### Error Responses

| Status | Body `error` | Condition |
|---|---|---|
| 401 | `Authentication required` | no/malformed `Authorization` header |
| 401 | `Invalid or expired session` | token invalid/expired |

---

## 4. Verify OTP

Verifies the 6-digit code. For `purpose: "registration"` this **activates the account and
returns the first session** (same shape as Login). For `purpose: "password_reset"` it just
opens a short window to call **Reset Password**.

| | |
|---|---|
| **Method / Path** | `POST /api/auth/otp/verify` |
| **Auth** | None |

### Request Body

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string (email) | ✅ | |
| `code` | string | ✅ | exactly 6 characters |
| `purpose` | enum | ✅ | `"registration" \| "password_reset"` |

### Sample Request

```http
POST /api/auth/otp/verify
Content-Type: application/json

{ "email": "camila.vargas@example.com", "code": "482100", "purpose": "registration" }
```

### Success Response

`200 OK` — registration:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "role": "patient", "status": "active", "...": "..." }
}
```

`200 OK` — password_reset:

```json
{ "verified": true }
```

### Error Responses

| Status | Body `error` | Condition |
|---|---|---|
| 400 | `Validation failed` | code not exactly 6 chars, etc. |
| 404 | `User not found` | |
| 400 | `No pending verification for this request` | no OTP was ever sent, or `purpose` doesn't match the pending one |
| 400 | `Code has expired — request a new one` | past the configured expiry (default 10 min) |
| 429 | `Too many attempts — request a new code` | 5 wrong attempts on the same code |
| 401 | `Invalid or expired code` | wrong code (increments the attempt counter) |
| 429 | rate limited | see above |

---

## 5. Resend OTP

Re-sends a code for a pending purpose, honoring a per-account resend cooldown (default 60s,
platform-configurable).

| | |
|---|---|
| **Method / Path** | `POST /api/auth/otp/resend` |
| **Auth** | None |

### Request Body

| Field | Type | Required |
|---|---|---|
| `email` | string (email) | ✅ |
| `purpose` | enum (`"registration" \| "password_reset"`) | ✅ |

### Sample Request

```http
POST /api/auth/otp/resend
Content-Type: application/json

{ "email": "camila.vargas@example.com", "purpose": "registration" }
```

### Success Response

`200 OK`

```json
{
  "otpSentVia": "email",
  "expiresAt": "2026-07-21T10:42:00.000Z",
  "expiresInSeconds": 600
}
```

- `expiresAt` — ISO-8601 timestamp the code stops being valid.
- `expiresInSeconds` — same expiry expressed as a duration (default 600s / 10 min,
  platform-configurable), handy for driving a countdown in the UI.

### Error Responses

| Status | Body `error` | Condition |
|---|---|---|
| 400 | `Validation failed` | |
| 404 | `User not found` | |
| 429 | `Please wait {N}s before requesting another code` | resend cooldown not elapsed |
| 400 | `No phone number on file — choose email instead` | last channel was `sms` but no phone on file |
| 429 | rate limited | see above (global 5/15min limiter) |

---

## 6. Forgot Password — Contact Options

Precursor to **Forgot Password**. Reports which delivery channels exist for the account,
**masked**, so the client can render a "send code via email / sms" radio-button choice before
calling Forgot Password.

| | |
|---|---|
| **Method / Path** | `POST /api/auth/forgot-password/options` |
| **Auth** | None |

### Request Body

| Field | Type | Required | Notes |
|---|---|---|---|
| `identifier` | string | ✅ | email or phone, min 3 chars |

### Sample Request

```http
POST /api/auth/forgot-password/options
Content-Type: application/json

{ "identifier": "maria@demo.ucc.co" }
```

### Success Response

`200 OK`

```json
{
  "options": [
    { "channel": "email", "masked": "m***a@demo.ucc.co" },
    { "channel": "sms", "masked": "+** *** *** **00" }
  ]
}
```

- `masked` values are partial-reveal only (fixed 3-character mask on email; all but the last 2
  digits masked on phone) — never the full email/phone.
- The `sms` option is only present if the account has a phone on file.
- **Unknown identifier → `200` with `{ "options": [] }`**, not a 404 — this lookup step stays
  non-revealing even though Forgot Password itself (below) now confirms existence.

### Error Responses

| Status | Body `error` | Condition |
|---|---|---|
| 400 | `Validation failed` | `identifier` too short |
| 429 | rate limited | see above |

---

## 7. Forgot Password

Sends the password-reset code and **confirms whether it was actually sent** — unlike Contact
Options above, this endpoint reveals whether an account exists for the given identifier (an
intentional tradeoff, consistent with how Resend OTP already behaves in this API). Works by
`email` or `phone` — service auto-detects which.

| | |
|---|---|
| **Method / Path** | `POST /api/auth/forgot-password` |
| **Auth** | None |

### Request Body

| Field | Type | Required | Notes |
|---|---|---|---|
| `identifier` | string | ✅ | email or phone, min 3 chars |
| `channel` | enum | | `"email" \| "sms"` — defaults to the account's last-used channel / the platform default |

### Sample Request

```http
POST /api/auth/forgot-password
Content-Type: application/json

{ "identifier": "maria@demo.ucc.co" }
```

### Success Response

`200 OK`

```json
{
  "ok": true,
  "otpSentVia": "email",
  "expiresAt": "2026-07-21T10:42:00.000Z",
  "expiresInSeconds": 600
}
```

### Error Responses

| Status | Body `error` | Condition |
|---|---|---|
| 400 | `Validation failed` | `identifier` too short |
| 404 | `No account found for that email or phone number` | no account matches |
| 400 | `No phone number on file — choose email instead` | `channel: "sms"` but no phone on file |
| 429 | rate limited | see above |

*(Next step: call **Verify OTP** with `purpose: "password_reset"` using the code that was
sent, then **Reset Password**.)*

---

## 8. Reset Password

Requires a **verified** `password_reset` OTP window (i.e. Verify OTP must have already
succeeded for this identifier).

| | |
|---|---|
| **Method / Path** | `POST /api/auth/reset-password` |
| **Auth** | None (identity is proven by the prior OTP verification) |

### Request Body

| Field | Type | Required | Notes |
|---|---|---|---|
| `identifier` | string | ✅ | same email/phone used in Forgot Password |
| `newPassword` | string | ✅ | min 8 chars |
| `confirmPassword` | string | ✅ | must match `newPassword` |

### Sample Request

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "identifier": "maria@demo.ucc.co",
  "newPassword": "NewStr0ng!Pass",
  "confirmPassword": "NewStr0ng!Pass"
}
```

### Success Response

`200 OK`

```json
{ "ok": true }
```

Side effects: password is updated, the OTP window is cleared, and **all existing refresh
tokens for the account are revoked** (forces re-login everywhere).

### Error Responses

| Status | Body `error` | Condition |
|---|---|---|
| 400 | `Validation failed` | passwords don't match / too short |
| 400 | `Verify your identity with a code before resetting your password` | no verified `password_reset` OTP window is open for this identifier |
| 429 | rate limited | see above |

---

## Typical patient flows

**Registration:** `Register` → `Verify OTP (purpose=registration)` → tokens returned, account
active.

**Forgot password:** `Forgot Password — Contact Options` (render the channel picker) →
`Forgot Password` (send the code) → `Verify OTP (purpose=password_reset)` → `Reset Password`.

**Related endpoints not covered above** (token lifecycle, for context):
`POST /api/auth/refresh` (exchange a refresh token for a new access token, no auth header
needed) and `GET /api/auth/me` (returns the current `PublicUser`, requires
`Authorization: Bearer`).
