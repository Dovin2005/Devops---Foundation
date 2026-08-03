import { z } from 'zod';

// ---- Canonical role model (exactly eight) ----
export const ROLES = [
  'patient',
  'physician',
  'coordinator',
  'office_manager',
  'super_admin',
  'marketing',
  'fulfillment',
  'nurse',
] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: Role[] = [
  'physician', 'coordinator', 'office_manager', 'super_admin', 'marketing', 'fulfillment', 'nurse',
];

// Roles reachable through the shared /login endpoint. Patient and super_admin
// each have their own dedicated login endpoint instead.
export const SHARED_LOGIN_ROLES: Role[] = STAFF_ROLES.filter((r) => r !== 'super_admin');

export const CITIES = ['Medellín', 'Cartagena', 'Bogotá'] as const;
export type City = (typeof CITIES)[number];

// Kong route prefixes → service (kept in sync with infra/kong/kong.yml).
export const SERVICE_ROUTES = {
  auth: '/api/auth',
  patients: '/api/patients',
  scheduling: '/api/scheduling',
  clinical: '/api/clinical',
  billing: '/api/billing',
  comms: '/api/comms',
  admin: '/api/admin',
} as const;

// ---- Booking / case domain ----
export const VISIT_TYPES = ['in_office', 'telehealth', 'at_home'] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const CASE_STATUSES = [
  'booked', 'intake', 'awaiting_acceptance', 'accepted', 'in_consult',
  'orders_pending', 'in_execution', 'results_review', 'billing', 'closed',
  'declined', 'cancelled',
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const ORDER_PRIORITIES = ['red', 'orange', 'yellow', 'green', 'blue'] as const;
export type OrderPriority = (typeof ORDER_PRIORITIES)[number];

// Consent trio + point-of-care (UCC_19 addendum §A4).
export const CONSENT_TYPES = [
  'treatment', 'data_privacy', 'telehealth', 'recording',
  'wound_care', 'iv_therapy', 'labs', 'imaging', 'injection',
  'minor_procedure', 'medication', 'sample_collection', 'general_care',
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

// Colombian patient ID types (D-12).
export const ID_TYPES = ['CC', 'CE', 'TI', 'PA', 'PEP-PPT', 'NIT'] as const;

// ---- Auth DTOs (zod — validated at service boundary + reused on the client) ----
export const roleSchema = z.enum(ROLES);

const baseAccountFields = {
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  city: z.enum(CITIES).optional(),
  language: z.enum(['es', 'en', 'bilingual']).optional(),
};

// Family members are captured as a single name at registration time (not the
// primary patient's legal identity) — split into first/last server-side to
// reuse the existing Dependent model without a schema change.
const familyMemberSchema = z.object({
  fullName: z.string().min(1),
  relationship: z.string().min(1),
});

const patientProfileFields = {
  dob: z.string().date().optional(),
  idType: z.enum(ID_TYPES).optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  country: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  familyMembers: z.array(familyMemberSchema).optional(),
  consents: z.array(z.enum(CONSENT_TYPES)).optional(),
};

export const PHYSICIAN_TYPES = ['GP', 'Specialist'] as const;

const physicianProfileFields = {
  physicianType: z.enum(PHYSICIAN_TYPES).optional(),
  // One or more Category ids (doctor specialties catalog — see Content/CMS section).
  specialtyIds: z.array(z.string().uuid()).optional(),
  physicianLicenseNo: z.string().optional(),
  encounterPrivileges: z.array(z.enum(VISIT_TYPES)).optional(),
  languages: z.array(z.enum(['es', 'en'])).optional(),
};

// Public self-registration — patient only. The other seven canonical roles
// are hospital staff and can only be created by an admin (adminCreateUserSchema).
export const registerSchema = z.object({
  ...baseAccountFields,
  ...patientProfileFields,
  lastName: z.string().optional(),
  city: z.string().optional(),
  confirmPassword: z.string().optional(),
  otpChannel: z.enum(['email', 'sms']).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// Admin-created accounts (super_admin, via superadmin-service) — any of the
// eight canonical roles, including staff that can't self-register.
export const adminCreateUserSchema = z.object({
  role: roleSchema,
  ...baseAccountFields,
  ...patientProfileFields,
  ...physicianProfileFields,
});
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: roleSchema.optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Dedicated patient/super_admin logins — role is implied by the endpoint, not
// sent by the client.
export const credentialsLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type CredentialsLoginInput = z.infer<typeof credentialsLoginSchema>;

export const OTP_PURPOSES = ['registration', 'password_reset'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const otpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: z.enum(OTP_PURPOSES),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const otpResendSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(OTP_PURPOSES),
});
export type OtpResendInput = z.infer<typeof otpResendSchema>;

// `identifier` is an email or phone — service layer looks up by whichever matches.
export const forgotPasswordSchema = z.object({
  identifier: z.string().min(3),
  channel: z.enum(['email', 'sms']).optional(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Precursor to Forgot Password — same identifier, but only reports which
// delivery channels are available (masked) so the client can render a
// "send code via email / sms" choice before calling forgot-password.
export const forgotPasswordOptionsSchema = z.object({
  identifier: z.string().min(3),
});
export type ForgotPasswordOptionsInput = z.infer<typeof forgotPasswordOptionsSchema>;

export interface ContactOption {
  channel: 'email' | 'sms';
  masked: string;
}

export const resetPasswordSchema = z
  .object({
    identifier: z.string().min(3),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export interface JwtClaims {
  sub: string;
  role: Role;
  name: string;
  patientId?: string;
  locationId?: string;
  type: 'access' | 'refresh';
  // Snapshot of the role's permission matrix at sign time (see PermissionMatrix
  // below) — refreshed on every login/token-refresh. super_admin bypasses this
  // check entirely (see requirePermission in @ucc/service-kit).
  permissions?: PermissionMatrix;
}

export interface PublicUser {
  id: string;
  role: Role;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone?: string | null;
  city?: string | null;
  status: string;
  languagePref: string;
  patientId?: string;
  locationId?: string | null;
  physicianType?: string | null;
  physicianSpecialtyIds?: string[];
  physicianSpecialtyNames?: string[];
  physicianLicenseNo?: string | null;
  credentialsVerified?: boolean;
}

// ---- Guest-first booking (UCC_19 addendum §A1) ----
// Locked order: Service → Who → When + intake (one call, 10-min hold) →
// Payment + confirmation (one call). Prices quoted USD, charged COP at TRM.
export const CONSENT_TRIO: ConsentType[] = ['treatment', 'data_privacy', 'telehealth'];

// Booking API — combines the old "hold slot" + "submit intake" calls into one:
// the slot is reserved at the moment the whole form (details + intake +
// consents) is submitted, not the instant a time is picked.
export const bookAppointmentSchema = z.object({
  serviceCode: z.string().min(1).default('consultation'),
  modality: z.enum(VISIT_TYPES), // the consultation option chosen in step 1
  city: z.enum(CITIES).optional(),
  providerId: z.string().uuid().optional(), // omit = next available
  slotStart: z.string().datetime(),
  // Registered patients may omit persons — the service fills it from their
  // patient record. Guests must send at least one person (enforced in-service).
  persons: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dob: z.string().optional(),
    idType: z.enum(ID_TYPES).optional(),
    idNumber: z.string().optional(),
  })).min(1).optional(),
  guest: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
  }).optional(), // present for guest bookings (no Authorization header)
  intake: z.object({
    reason: z.string().min(5),
    goals: z.string().optional(),
    bodyAreas: z.array(z.string()).optional(),
    onset: z.enum(['today', 'days', 'weeks', 'months']).optional(),
    severity: z.number().int().min(1).max(10).optional(),
    hasFever: z.boolean().optional(),
    takingMedication: z.boolean().optional(),
    consents: z.array(z.object({
      type: z.enum(CONSENT_TYPES),
      signedBy: z.string().min(1),
    })).min(1), // guests must sign the trio
  }),
});
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type IntakeInput = BookAppointmentInput['intake'];

// Booking charge price by modality (Telehealth $75 / In-office $100 / Home $175).
// Source of truth for what a booking pre-pays; provider.consultPriceUsd stays for
// the directory display and post-consult quotes.
export const MODALITY_PRICE_USD: Record<VisitType, number> = {
  telehealth: 75,
  in_office: 100,
  at_home: 175,
};

// Booking step 1 — the consultation options card (labels/descriptions match the
// booking wizard UI). Prices come from MODALITY_PRICE_USD so there is one source
// of truth for what a booking pre-authorizes.
export const CONSULTATION_OPTIONS = [
  { code: 'telehealth', label: 'Telehealth', description: '30-min video · anywhere', priceUsd: MODALITY_PRICE_USD.telehealth, popular: true },
  { code: 'in_office', label: 'In-office Visit', description: 'Same-day · Urgent Care Colombia', priceUsd: MODALITY_PRICE_USD.in_office, popular: false },
  { code: 'at_home', label: 'Home Visit', description: 'Within 2–3 hours', priceUsd: MODALITY_PRICE_USD.at_home, popular: false },
] as const satisfies ReadonlyArray<{ code: VisitType; label: string; description: string; priceUsd: number; popular: boolean }>;

// Backend-only + Stripe: the client passes a Stripe PaymentMethod id (Stripe.js /
// Elements tokenizes the card so raw PAN never touches our backend). In test mode
// the service defaults to `pm_card_visa` when none is supplied.
export const payBookingSchema = z.object({
  currency: z.enum(['usd', 'cop']).default('usd'),
  paymentMethodId: z.string().optional(),
  // Signed-in patients only — attaches the used card to their Stripe Customer
  // and stores it in payment_methods for reuse on a future booking.
  savePaymentMethod: z.boolean().optional(),
});
export type PayBookingInput = z.infer<typeof payBookingSchema>;

// ---- Physician 12-step guided chart (hard-stops at 1, 2, 9, 12) ----
export interface ChartStepDef {
  step: number;
  key: string;
  label: string;
  hardStop: boolean;
  min?: number;
  max?: number;
}
export const CHART_STEPS: ChartStepDef[] = [
  { step: 1, key: 'consent', label: 'Informed consent', hardStop: true },
  { step: 2, key: 'identification', label: 'Patient identification', hardStop: true },
  { step: 3, key: 'pmh', label: 'Past medical history', hardStop: false },
  { step: 4, key: 'chief_complaint', label: 'Chief complaint', hardStop: false, min: 10, max: 150 },
  { step: 5, key: 'hpi', label: 'History of present illness', hardStop: false, min: 50, max: 1500 },
  { step: 6, key: 'ros', label: 'Review of systems', hardStop: false },
  { step: 7, key: 'exam_vitals', label: 'Physical exam + vitals', hardStop: false },
  { step: 8, key: 'assessment', label: 'Assessment / impression', hardStop: false, min: 80, max: 1200 },
  { step: 9, key: 'diagnosis', label: 'ICD-10 / CIE-10 diagnosis', hardStop: true },
  { step: 10, key: 'plan', label: 'Plan of care + orders', hardStop: false },
  { step: 11, key: 'attachments', label: 'Attachments', hardStop: false },
  { step: 12, key: 'signature', label: 'Closure + signature', hardStop: true },
];

export const chartStepSchema = z.object({
  payload: z.record(z.string(), z.unknown()),
});

export const ORDER_TYPES = [
  'lab', 'imaging', 'specialist', 'nurse_procedure', 'therapy', 'follow_up',
  'certificate', 'medical_leave',
] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const createOrderSchema = z.object({
  type: z.enum(ORDER_TYPES),
  cupsCode: z.string().optional(),
  description: z.string().min(1),
  priority: z.enum(ORDER_PRIORITIES).default('green'),
  timeframe: z.string().optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const createPrescriptionSchema = z.object({
  items: z.array(z.object({
    medicineName: z.string().min(1),
    dose: z.string().optional(),
    schedule: z.string().optional(),
    food: z.string().optional(),
    durationDays: z.number().int().positive().optional(),
  })).min(1),
  language: z.enum(['es', 'en', 'bilingual']).default('bilingual'),
  controlled: z.boolean().default(false),
});
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

// ---- Billing (prices quoted USD, charged COP at the day's TRM — UCC_19 §A2) ----
export const quoteLineSchema = z.object({
  label: z.string().min(1),
  catalogPriceUsd: z.number().nonnegative(),
  markupPct: z.number().min(0).max(100).default(20),
});

export const createQuoteSchema = z.object({
  caseId: z.string().uuid(),
  patientId: z.string().uuid().optional(),
  orderIds: z.array(z.string()).optional(),
  lines: z.array(quoteLineSchema).min(1),
});
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

export const generateInvoiceSchema = z.object({
  patientId: z.string().uuid().optional(),
  consultPriceUsd: z.number().nonnegative().default(0),
});

// ---- Saved payment methods (Stripe Customer + reusable cards) ----
// `paymentMethodId` is a Stripe PaymentMethod id already tokenized client-side
// (Stripe.js/Elements) — raw card data never reaches this backend.
export const savePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
  makeDefault: z.boolean().optional(),
});
export type SavePaymentMethodInput = z.infer<typeof savePaymentMethodSchema>;

export interface SavedPaymentMethodDto {
  id: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
}

// ---- Super Admin (platform administration) ----
// Data + business logic live in auth-service (owns Location/RoleConfig/
// PlatformSetting/AuditLog); superadmin-service is a thin RBAC-gated proxy
// over auth-service's internal admin API. These schemas are shared by both.
// Roles are the canonical eight and cannot be created or deleted; Role
// Configuration edits each role's permission matrix / scope / PHI export level.
export const PERMISSION_MODULES = [
  'patients', 'scheduling', 'clinical', 'billing', 'commerce',
  'marketing', 'fulfillment', 'reports', 'admin',
] as const;
export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'export'] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const PHI_EXPORT_LEVELS = ['none', 'self', 'clinical', 'aggregate', 'with_justification'] as const;
export type PhiExportLevel = (typeof PHI_EXPORT_LEVELS)[number];

export type PermissionMatrix = Partial<Record<PermissionModule, PermissionAction[]>>;

export const updateRoleConfigSchema = z.object({
  scope: z.string().min(1).max(60).optional(),
  description: z.string().max(240).optional(),
  permissions: z.record(z.enum(PERMISSION_MODULES), z.array(z.enum(PERMISSION_ACTIONS))).optional(),
  phiExport: z.enum(PHI_EXPORT_LEVELS).optional(),
});
export type UpdateRoleConfigInput = z.infer<typeof updateRoleConfigSchema>;

export const LOCATION_STATUSES = ['active', 'inactive'] as const;

// 24h "HH:mm", e.g. "09:00" — validated once here, reused for open/close.
const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected 24h time as HH:mm');

export const createLocationSchema = z.object({
  city: z.enum(CITIES),
  name: z.string().min(1).max(120),
  address: z.string().max(240).optional(),
  phone: z.string().max(40).optional(),
  officeManagerId: z.string().uuid().optional(),
  officeManagerName: z.string().max(120).optional(),
  openTime: timeOfDaySchema.optional(),
  closeTime: timeOfDaySchema.optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});
export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = createLocationSchema.partial().extend({
  status: z.enum(LOCATION_STATUSES).optional(),
});
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

// Bulk upsert — { settings: { 'pricing.defaultMarkupPct': 15, ... } }
export const updateSettingsSchema = z.object({
  settings: z.record(z.string().min(1).max(80), z.unknown()),
});
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

// ---- Third-party integration credentials (Settings module, Super Admin only) ----
export const INTEGRATION_PROVIDERS = ['stripe', 'twilio', 'sendgrid', 'google', 'firebase'] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

// Which keys are secret (encrypted + masked on read) vs public (shown as-is) per provider.
export const PROVIDER_FIELDS: Record<IntegrationProvider, Record<string, { isSecret: boolean }>> = {
  stripe: {
    secretKey: { isSecret: true },
    publishableKey: { isSecret: false },
    webhookSecret: { isSecret: true },
  },
  twilio: {
    accountSid: { isSecret: true },
    authToken: { isSecret: true },
    phoneNumber: { isSecret: false },
  },
  sendgrid: {
    apiKey: { isSecret: true },
    senderEmail: { isSecret: false },
  },
  google: {
    credentialsJson: { isSecret: true },
  },
  firebase: {
    credentialsJson: { isSecret: true },
  },
};

export const updateIntegrationCredentialsSchema = z.object({
  provider: z.enum(INTEGRATION_PROVIDERS),
  values: z.record(z.string().min(1).max(80), z.string()),
});
export type UpdateIntegrationCredentialsInput = z.infer<typeof updateIntegrationCredentialsSchema>;

// ---- OTP delivery (auth-service -> notification-service, internal only) ----
export const sendOtpSchema = z.object({
  channel: z.enum(['email', 'sms']),
  to: z.string().min(1),
  code: z.string().length(6),
  purpose: z.enum(OTP_PURPOSES),
});
export type SendOtpInput = z.infer<typeof sendOtpSchema>;

// ---- Content / CMS (public marketing site — auth-service owns the data,
// superadmin-service proxies admin writes, auth-service also serves the
// public reads directly under /api/auth/public). Gated by the 'marketing'
// permission module (see PERMISSION_MODULES above) rather than a hardcoded role.
export const ACTIVE_STATUSES = ['active', 'inactive'] as const;
export type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

// Doctor specialty catalog — a Provider (core-service) links to one or more
// Category ids; the public "Meet Our Specialists" filter chips are driven by this list.
export const createCategorySchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
  description: z.string().max(400).optional(),
  icon: z.string().max(80).optional(),
  displayOrder: z.number().int().min(0).default(0),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export const updateCategorySchema = createCategorySchema.partial().extend({
  status: z.enum(ACTIVE_STATUSES).optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Services catalog (the public "Services" page — urgent care visit, labs, imaging, ...).
export const createServiceOfferingSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(400).optional(),
  priceLabel: z.string().max(60).optional(), // free text: "From $90,000 COP" | "Quoted per order"
  icon: z.string().max(80).optional(),
  displayOrder: z.number().int().min(0).default(0),
});
export type CreateServiceOfferingInput = z.infer<typeof createServiceOfferingSchema>;
export const updateServiceOfferingSchema = createServiceOfferingSchema.partial().extend({
  status: z.enum(ACTIVE_STATUSES).optional(),
});
export type UpdateServiceOfferingInput = z.infer<typeof updateServiceOfferingSchema>;

export const FAQ_STATUSES = ['published', 'draft'] as const;
export type FaqStatus = (typeof FAQ_STATUSES)[number];

export const createFaqSchema = z.object({
  category: z.string().min(1).max(60), // free-text group label: "General" | "Appointments" | "Telehealth" | "Insurance & Billing"
  question: z.string().min(1).max(240),
  answer: z.string().min(1).max(2000),
  displayOrder: z.number().int().min(0).default(0),
});
export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export const updateFaqSchema = createFaqSchema.partial().extend({
  status: z.enum(FAQ_STATUSES).optional(),
});
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;

export const CAREER_STATUSES = ['open', 'closed'] as const;
export type CareerStatus = (typeof CAREER_STATUSES)[number];

export const createCareerSchema = z.object({
  title: z.string().min(1).max(120),
  department: z.string().min(1).max(60),
  location: z.string().min(1).max(80), // free text: "Medellín / Bogotá" | "All Cities" | "Remote"
  employmentType: z.string().min(1).max(40), // "Full-time" | "Contract" | "Gig / per-visit"
  description: z.string().min(1).max(4000),
  requirements: z.string().max(4000).optional(),
  displayOrder: z.number().int().min(0).default(0),
});
export type CreateCareerInput = z.infer<typeof createCareerSchema>;
export const updateCareerSchema = createCareerSchema.partial().extend({
  status: z.enum(CAREER_STATUSES).optional(),
});
export type UpdateCareerInput = z.infer<typeof updateCareerSchema>;

// Patient testimonials ("Feedback From Our Patients"). Public submit → pending;
// admin approves/rejects; public list shows approved only.
export const TESTIMONIAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];

export const submitTestimonialSchema = z.object({
  patientName: z.string().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  quote: z.string().min(1).max(1000),
});
export type SubmitTestimonialInput = z.infer<typeof submitTestimonialSchema>;

// Contact Us submissions (public form → admin inbox).
export const CONTACT_SUBMISSION_STATUSES = ['new', 'read', 'resolved'] as const;
export type ContactSubmissionStatus = (typeof CONTACT_SUBMISSION_STATUSES)[number];

export const createContactSubmissionSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  serviceCategory: z.string().max(80).optional(),
  reason: z.string().max(200).optional(),
  message: z.string().min(1).max(2000),
});
export type CreateContactSubmissionInput = z.infer<typeof createContactSubmissionSchema>;

export const updateContactSubmissionStatusSchema = z.object({
  status: z.enum(CONTACT_SUBMISSION_STATUSES),
});
export type UpdateContactSubmissionStatusInput = z.infer<typeof updateContactSubmissionStatusSchema>;

