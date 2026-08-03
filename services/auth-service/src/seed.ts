import bcrypt from 'bcryptjs';
import { initDb, disconnectDb, prisma } from './config/db.js';
import { userRepository } from './repositories/user.repository.js';
import type { PermissionMatrix, PhiExportLevel, Role } from '@ucc/types';
import type { Prisma } from './generated/prisma/index.js';

export const DEMO_PASSWORD = 'Demo123!';

// Fixed ids so core-service's own seed.ts (separate process, no DB access to
// this service's Category table) can reference the same specialties in
// Provider.specialtyIds — the two seed scripts can't look each other up at
// seed time, so the ids are hardcoded identically in both places.
export const SEED_CATEGORY_IDS = {
  generalMedicine: '00000000-0000-4000-8000-000000000001',
  cardiology: '00000000-0000-4000-8000-000000000002',
  gynecology: '00000000-0000-4000-8000-000000000003',
  pediatrics: '00000000-0000-4000-8000-000000000004',
} as const;

const CATEGORIES = [
  { id: SEED_CATEGORY_IDS.generalMedicine, name: 'General Medicine', slug: 'general-medicine', displayOrder: 0 },
  { id: SEED_CATEGORY_IDS.cardiology, name: 'Cardiology', slug: 'cardiology', displayOrder: 1 },
  { id: SEED_CATEGORY_IDS.gynecology, name: 'Gynecology', slug: 'gynecology', displayOrder: 2 },
  { id: SEED_CATEGORY_IDS.pediatrics, name: 'Pediatrics', slug: 'pediatrics', displayOrder: 3 },
];

const DEMO = [
  { role: 'patient', email: 'maria@demo.ucc.co', firstName: 'María', lastName: 'Ríos', city: 'Medellín', languagePref: 'es' },
  { role: 'physician', email: 'andres@demo.ucc.co', firstName: 'Andrés', lastName: 'Ramírez', city: 'Medellín', physicianType: 'GP', physicianSpecialtyIds: [SEED_CATEGORY_IDS.generalMedicine] as string[], physicianSpecialtyNames: ['General Medicine'] as string[], physicianLicenseNo: 'COL-123456', credentialsVerified: true },
  { role: 'coordinator', email: 'ana@demo.ucc.co', firstName: 'Ana', lastName: 'García', city: 'Medellín' },
  { role: 'office_manager', email: 'sofia@demo.ucc.co', firstName: 'Sofía', lastName: 'Restrepo', city: 'Medellín', mfaEnabled: true },
  { role: 'super_admin', email: 'daniel@demo.ucc.co', firstName: 'Daniel', lastName: 'Mejía', mfaEnabled: true },
  { role: 'marketing', email: 'carolina@demo.ucc.co', firstName: 'Carolina', lastName: 'Duque' },
  { role: 'fulfillment', email: 'javier@demo.ucc.co', firstName: 'Javier', lastName: 'Ortiz', city: 'Bogotá' },
  { role: 'nurse', email: 'laura@demo.ucc.co', firstName: 'Laura', lastName: 'Gómez', city: 'Medellín' },
] as const;

// ---- Role configuration defaults (canonical eight — reconfigurable, never added/removed) ----
const ALL: PermissionMatrix = {
  patients: ['view', 'create', 'edit', 'delete', 'export'],
  scheduling: ['view', 'create', 'edit', 'delete', 'export'],
  clinical: ['view', 'create', 'edit', 'delete', 'export'],
  billing: ['view', 'create', 'edit', 'delete', 'export'],
  commerce: ['view', 'create', 'edit', 'delete', 'export'],
  marketing: ['view', 'create', 'edit', 'delete', 'export'],
  fulfillment: ['view', 'create', 'edit', 'delete', 'export'],
  reports: ['view', 'create', 'edit', 'delete', 'export'],
  admin: ['view', 'create', 'edit', 'delete', 'export'],
};

const ROLE_DEFAULTS: Array<{ role: Role; scope: string; description: string; permissions: PermissionMatrix; phiExport: PhiExportLevel }> = [
  { role: 'patient', scope: 'Self', description: 'Own records, booking, pay', phiExport: 'self',
    permissions: { patients: ['view'], scheduling: ['view', 'create'], billing: ['view'] } },
  { role: 'physician', scope: 'Privilege-based', description: 'Charts, orders, prescriptions', phiExport: 'clinical',
    permissions: { clinical: ['view', 'create', 'edit'], patients: ['view'], scheduling: ['view'] } },
  { role: 'coordinator', scope: 'Assigned cases', description: 'Coordinate, message, quote', phiExport: 'none',
    permissions: { patients: ['view', 'edit'], scheduling: ['view', 'create', 'edit'], clinical: ['view'], billing: ['view', 'create'] } },
  { role: 'office_manager', scope: 'One location', description: 'Oversight, templates, reports', phiExport: 'aggregate',
    // 'marketing' (careers/services/FAQs/etc.) — office managers can manage
    // public site content alongside super_admin, per the Careers requirement.
    permissions: { patients: ['view'], scheduling: ['view', 'edit'], billing: ['view', 'edit'], reports: ['view', 'export'], admin: ['view'], marketing: ['view', 'create', 'edit'] } },
  { role: 'super_admin', scope: 'All locations', description: 'Approvals, pricing, config', phiExport: 'with_justification',
    permissions: ALL },
  { role: 'marketing', scope: 'Campaigns', description: 'Campaigns, attribution, CMS', phiExport: 'none',
    permissions: { marketing: ['view', 'create', 'edit', 'delete'], reports: ['view'] } },
  { role: 'fulfillment', scope: 'Orders & delivery', description: 'Pharmacy and supply fulfillment', phiExport: 'none',
    permissions: { fulfillment: ['view', 'edit'], commerce: ['view', 'edit'] } },
  { role: 'nurse', scope: 'Assigned visits', description: 'Field visits, procedures, vitals', phiExport: 'none',
    permissions: { clinical: ['view', 'create'], patients: ['view'], scheduling: ['view'] } },
];

// ---- Demo locations (one per launch city) ----
const LOCATIONS = [
  { city: 'Medellín', name: 'UCC Medellín — El Poblado', address: 'Cra. 43A #6 Sur-15, El Poblado', phone: '+57 604 444 0001', officeManagerName: 'S. Restrepo' },
  { city: 'Cartagena', name: 'UCC Cartagena — Bocagrande', address: 'Av. San Martín #5-104, Bocagrande', phone: '+57 605 665 0002', officeManagerName: 'M. Polo' },
  { city: 'Bogotá', name: 'UCC Bogotá — Chicó', address: 'Cra. 11 #93-46, Chicó', phone: '+57 601 745 0003', officeManagerName: 'J. Acosta' },
];

// ---- Platform settings (namespaced keys) ----
const SETTINGS: Record<string, unknown> = {
  'pricing.defaultMarkupPct': 15,
  'pricing.quoteApproval': 'coordinator_review',
  'scheduling.coordinatorConcurrency': 3,
  'scheduling.holdMinutes': 10,
  'compliance.dataRetentionYears': 7,
  'notifications.email.enabled': true,
  'notifications.whatsapp.enabled': true,
  'notifications.sms.enabled': false,
  'branding.appName': 'Urgent Care Colombia',
  'integrations.payment': { provider: 'Wompi', label: 'Payment gateway', detail: 'PCI tokenized', status: 'connected' },
  'integrations.whatsapp': { provider: 'Meta', label: 'WhatsApp Business API', detail: 'Pending Meta verification', status: 'setup' },
  'integrations.telehealth': { provider: 'Daily.co', label: 'Telehealth video SDK', detail: 'Daily.co', status: 'connected' },
  'integrations.ads': { provider: 'Google', label: 'Google Ads', detail: 'Conversion export', status: 'phase2' },
};

// Each block guards independently — re-running after users already exist must
// still seed roles/locations/settings if those are still empty.
export async function seed(): Promise<boolean> {
  let did = false;
  // Seeded before users — the demo physician references these ids.
  if ((await prisma.category.count()) === 0) {
    for (const c of CATEGORIES) await prisma.category.create({ data: c });
    did = true;
  }
  if ((await userRepository.count()) === 0) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    for (const u of DEMO) {
      await userRepository.create({ ...u, passwordHash, languagePref: (u as { languagePref?: string }).languagePref ?? 'en', status: 'active' });
    }
    did = true;
  }
  if ((await prisma.roleConfig.count()) === 0) {
    for (const r of ROLE_DEFAULTS) {
      await prisma.roleConfig.create({ data: { ...r, permissions: r.permissions as Prisma.InputJsonValue } });
    }
    did = true;
  }
  if ((await prisma.location.count()) === 0) {
    for (const l of LOCATIONS) await prisma.location.create({ data: l });
    did = true;
  }
  if ((await prisma.platformSetting.count()) === 0) {
    for (const [key, value] of Object.entries(SETTINGS)) {
      await prisma.platformSetting.create({ data: { key, value: value as Prisma.InputJsonValue } });
    }
    did = true;
  }
  return did;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('seed.ts')) {
  initDb()
    .then(seed)
    .then((did) => { console.log(did ? `[auth-service] seeded categories/users/roles/locations/settings (password ${DEMO_PASSWORD})` : '[auth-service] already seeded — skipped'); return disconnectDb(); })
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); });
}
