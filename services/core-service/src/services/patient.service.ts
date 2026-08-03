import { HttpError } from '@ucc/service-kit';
import type { JwtClaims } from '@ucc/types';
import { prisma } from '../config/db.js';
import type { Prisma } from '../generated/prisma/index.js';
import { patientRepository, dependentRepository } from '../repositories/patient.repository.js';
import type { Patient } from '../models/patient.model.js';
import type { Dependent } from '../models/dependent.model.js';
import type { Address, EmergencyContact } from '../models/patient.model.js';

export interface CreatePatientProfileInput {
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dob?: string;
  idType?: string;
  idNumber?: string;
  language?: string;
  address?: string;
  neighborhood?: string;
  country?: string;
  city?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  familyMembers?: Array<{ fullName: string; relationship: string }>;
  consents?: string[];
}

const CLINICAL_ROLES = ['physician', 'coordinator', 'office_manager', 'super_admin'];
const PATIENT_UPDATABLE = [
  'firstName', 'lastName', 'phone', 'email', 'language', 'idType', 'idNumber',
  'addresses', 'allergies', 'medications', 'conditions', 'marketingConsent', 'dob', 'sex',
] as const;

// Row-level scope: patients see only their own record; clinical roles may view;
// marketing/fulfillment never touch patient records (RBAC matrix).
function assertCanAccess(user: JwtClaims, patientId: string) {
  if (['marketing', 'fulfillment', 'nurse'].includes(user.role)) throw new HttpError(403, 'This role has no access to patient records');
  if (user.role === 'patient' && user.patientId !== patientId) throw new HttpError(403, 'You can only access your own record');
}

export const patientService = {
  async get(user: JwtClaims, id: string): Promise<{ patient: Patient; dependents: Dependent[] }> {
    assertCanAccess(user, id);
    const patient = await patientRepository.findById(id);
    if (!patient) throw new HttpError(404, 'Patient not found');
    const dependents = await dependentRepository.listForGuardian(id);
    return { patient, dependents };
  },

  async update(user: JwtClaims, id: string, body: Record<string, unknown>): Promise<Patient> {
    assertCanAccess(user, id);
    const patch: Record<string, unknown> = {};
    for (const k of PATIENT_UPDATABLE) if (body[k] !== undefined) patch[k] = body[k];
    return patientRepository.update(id, patch);
  },

  async search(user: JwtClaims, q: string): Promise<Patient[]> {
    if (!CLINICAL_ROLES.includes(user.role)) throw new HttpError(403, 'Not permitted');
    if (!q || q.trim().length < 2) return [];
    return patientRepository.search(q.trim());
  },

  async addDependent(user: JwtClaims, guardianId: string, body: Partial<Dependent>): Promise<Dependent> {
    assertCanAccess(user, guardianId);
    return dependentRepository.create({ ...body, guardianPatientId: guardianId });
  },

  async removeDependent(user: JwtClaims, guardianId: string, depId: string): Promise<void> {
    assertCanAccess(user, guardianId);
    await dependentRepository.remove(depId, guardianId);
  },

  // Internal-only (called from auth-service during registration). Creates the
  // Patient row plus any family members (Dependent) and registration-time
  // consents in one transaction — all-or-nothing on the core-service side.
  async createWithProfile(input: CreatePatientProfileInput): Promise<Patient> {
    const address: Address = {
      line1: input.address,
      city: input.city,
      neighbourhood: input.neighborhood,
      country: input.country,
    };
    const emergencyContact: EmergencyContact | undefined =
      input.emergencyContactName || input.emergencyContactPhone || input.emergencyContactRelationship
        ? { name: input.emergencyContactName, phone: input.emergencyContactPhone, relationship: input.emergencyContactRelationship }
        : undefined;

    return prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          userId: input.userId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          dob: input.dob ? new Date(input.dob) : undefined,
          idType: input.idType,
          idNumber: input.idNumber,
          language: input.language ?? 'es',
          addresses: (input.address || input.city || input.neighborhood || input.country ? [address] : []) as unknown as Prisma.InputJsonValue,
          ...(emergencyContact ? { emergencyContact: emergencyContact as unknown as Prisma.InputJsonValue } : {}),
        },
      });

      for (const member of input.familyMembers ?? []) {
        const [firstName, ...rest] = member.fullName.trim().split(/\s+/);
        await tx.dependent.create({
          data: {
            guardianPatientId: patient.id,
            firstName: firstName ?? member.fullName,
            lastName: rest.join(' ') || '—',
            relationship: member.relationship,
          },
        });
      }

      for (const type of input.consents ?? []) {
        await tx.consent.create({
          data: { patientId: patient.id, type, signedBy: `${input.firstName} ${input.lastName}`, signerRole: 'patient' },
        });
      }

      return patient;
    });
  },
};
