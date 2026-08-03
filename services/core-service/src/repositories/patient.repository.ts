import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { Patient } from '../models/patient.model.js';
import type { Dependent } from '../models/dependent.model.js';

export const patientRepository = {
  create(data: Prisma.PatientCreateInput): Promise<Patient> {
    return prisma.patient.create({ data });
  },
  findById(id: string): Promise<Patient | null> {
    return prisma.patient.findUnique({ where: { id } });
  },
  findByUserId(userId: string): Promise<Patient | null> {
    return prisma.patient.findFirst({ where: { userId } });
  },
  update(id: string, data: Record<string, unknown>): Promise<Patient> {
    return prisma.patient.update({ where: { id }, data: data as Prisma.PatientUpdateInput });
  },
  // Indexed name/id search, bounded. Text search stays fast via the index.
  search(q: string, limit = 25): Promise<Patient[]> {
    return prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { idNumber: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });
  },
};

export const dependentRepository = {
  // Called from patient.service.ts#addDependent with a `Partial<Dependent>`
  // (plus guardianPatientId) rather than a fully-typed create payload, so this
  // stays loosely typed at the boundary — same permissiveness the old
  // `DeepPartial<Dependent>` gave callers — and is cast for Prisma internally.
  create(data: Record<string, unknown>): Promise<Dependent> {
    return prisma.dependent.create({ data: data as Prisma.DependentCreateInput });
  },
  listForGuardian(guardianPatientId: string): Promise<Dependent[]> {
    return prisma.dependent.findMany({ where: { guardianPatientId } });
  },
  async remove(id: string, guardianPatientId: string): Promise<void> {
    await prisma.dependent.deleteMany({ where: { id, guardianPatientId } });
  },
};
