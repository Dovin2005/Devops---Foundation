import type { Case } from '../generated/prisma/index.js';

// Re-export the Prisma-generated model type as `CaseEntity` so the rest of
// the service (which historically avoided the bare name `Case`, since it
// clashes with SQL) keeps importing `CaseEntity` from here unmodified.
export type { Case as CaseEntity };
