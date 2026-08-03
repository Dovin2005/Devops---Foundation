import type { User } from '../generated/prisma/index.js';
import type { PublicUser, Role } from '@ucc/types';

// Re-export the Prisma-generated model type so the rest of the service
// (repositories/services/controllers) keeps importing `User` from here.
export type { User };

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    role: u.role as Role,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    name: `${u.firstName} ${u.lastName}`,
    phone: u.phone,
    city: u.city,
    status: u.status,
    languagePref: u.languagePref,
    patientId: u.patientId ?? undefined,
    locationId: u.locationId,
    physicianType: u.physicianType,
    physicianSpecialtyIds: u.physicianSpecialtyIds,
    physicianSpecialtyNames: u.physicianSpecialtyNames,
    physicianLicenseNo: u.physicianLicenseNo,
    credentialsVerified: u.credentialsVerified,
  };
}
