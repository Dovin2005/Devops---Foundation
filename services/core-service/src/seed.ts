import { initDb, disconnectDb } from './config/db.js';
import { providerRepository } from './repositories/provider.repository.js';

// Doctor specialty catalog lives in auth-service (Category) — a separate
// process/DB connection with no way to look up its ids at seed time here, so
// these must match auth-service's src/seed.ts SEED_CATEGORY_IDS exactly.
const SEED_CATEGORY_IDS = {
  generalMedicine: '00000000-0000-4000-8000-000000000001',
  cardiology: '00000000-0000-4000-8000-000000000002',
  gynecology: '00000000-0000-4000-8000-000000000003',
  pediatrics: '00000000-0000-4000-8000-000000000004',
};

const PROVIDERS = [
  { firstName: 'Andrés', lastName: 'Ramírez', type: 'GP', specialtyIds: [SEED_CATEGORY_IDS.generalMedicine], specialtyNames: ['General Medicine'], city: 'Medellín', consultPriceUsd: '75', rating: '4.8', modes: ['telehealth', 'in_office', 'at_home'] },
  { firstName: 'Diego', lastName: 'Castro', type: 'Specialist', specialtyIds: [SEED_CATEGORY_IDS.cardiology], specialtyNames: ['Cardiology'], city: 'Bogotá', consultPriceUsd: '175', rating: '4.9', modes: ['telehealth', 'in_office'] },
  { firstName: 'Valentina', lastName: 'López', type: 'Specialist', specialtyIds: [SEED_CATEGORY_IDS.gynecology], specialtyNames: ['Gynecology'], city: 'Medellín', consultPriceUsd: '100', rating: '4.7', modes: ['telehealth', 'in_office'] },
  { firstName: 'Sara', lastName: 'Chen', type: 'Specialist', specialtyIds: [SEED_CATEGORY_IDS.pediatrics], specialtyNames: ['Pediatrics'], city: 'Cartagena', consultPriceUsd: '100', rating: '4.9', modes: ['telehealth', 'at_home'] },
];

export async function seed(): Promise<boolean> {
  if ((await providerRepository.count()) > 0) return false;
  for (const p of PROVIDERS) await providerRepository.create(p);
  return true;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('seed.ts')) {
  initDb()
    .then(seed)
    .then((did) => { console.log(did ? `[core-service] seeded ${PROVIDERS.length} providers` : '[core-service] providers exist — skipped'); return disconnectDb(); })
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); });
}
