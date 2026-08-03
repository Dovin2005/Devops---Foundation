import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { Booking } from '../models/booking.model.js';
import type { CaseEntity } from '../models/case.model.js';

const ACTIVE_BOOKING_STATUSES = ['held', 'paid', 'confirmed'];
const TERMINAL_CASE_STATUSES = ['closed', 'cancelled', 'declined'];

export const bookingRepository = {
  create(data: Prisma.BookingCreateInput): Promise<Booking> {
    return prisma.booking.create({ data });
  },
  findById(id: string): Promise<Booking | null> {
    return prisma.booking.findUnique({ where: { id } });
  },
  save(b: Booking): Promise<Booking> {
    const { id, createdAt, updatedAt, ...rest } = b;
    return prisma.booking.update({ where: { id }, data: rest as Prisma.BookingUpdateInput });
  },
  countConfirmed(): Promise<number> {
    return prisma.booking.count({ where: { status: 'confirmed' } });
  },
  // "My appointments" — newest first.
  listByPatient(patientId: string, skip = 0, take = 25): Promise<[Booking[], number]> {
    return Promise.all([
      prisma.booking.findMany({ where: { patientId }, orderBy: { slotStart: 'desc' }, skip, take }),
      prisma.booking.count({ where: { patientId } }),
    ]);
  },
  // Double-booking guard: is this provider+slot already taken (held/paid/confirmed)?
  async slotTaken(providerId: string, slotStart: Date): Promise<boolean> {
    const n = await prisma.booking.count({
      where: { providerId, slotStart, status: { in: ACTIVE_BOOKING_STATUSES } },
    });
    return n > 0;
  },
  // Taken slot instants for a provider (for availability computation).
  async takenSlots(providerId: string): Promise<Set<number>> {
    const rows = await prisma.booking.findMany({
      where: {
        providerId,
        status: { in: ACTIVE_BOOKING_STATUSES },
        slotStart: { gt: new Date() },
      },
      select: { slotStart: true },
    });
    return new Set(rows.map((r) => r.slotStart.getTime()));
  },
  // Registration carryover — the most recent guest booking's Stripe Customer
  // id for this email, if any (see auth-service auth.service.ts#register).
  async latestGuestStripeCustomerId(email: string): Promise<string | null> {
    const b = await prisma.booking.findFirst({
      where: { guestFlag: true, guestEmail: { equals: email, mode: 'insensitive' }, guestStripeCustomerId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { guestStripeCustomerId: true },
    });
    return b?.guestStripeCustomerId ?? null;
  },
};

export const caseRepository = {
  create(data: Prisma.CaseCreateInput): Promise<CaseEntity> {
    return prisma.case.create({ data });
  },
  save(c: CaseEntity): Promise<CaseEntity> {
    const { id, createdAt, updatedAt, ...rest } = c;
    return prisma.case.update({ where: { id }, data: rest as Prisma.CaseUpdateInput });
  },
  findById(id: string): Promise<CaseEntity | null> {
    return prisma.case.findUnique({ where: { id } });
  },
  listByPatient(patientId: string, skip = 0, take = 25): Promise<[CaseEntity[], number]> {
    return Promise.all([
      prisma.case.findMany({ where: { patientId }, orderBy: { updatedAt: 'desc' }, skip, take }),
      prisma.case.count({ where: { patientId } }),
    ]);
  },
  listByProvider(providerId: string, skip = 0, take = 25): Promise<[CaseEntity[], number]> {
    return Promise.all([
      prisma.case.findMany({ where: { providerId }, orderBy: { updatedAt: 'desc' }, skip, take }),
      prisma.case.count({ where: { providerId } }),
    ]);
  },
  listByCoordinator(coordinatorId: string, skip = 0, take = 25): Promise<[CaseEntity[], number]> {
    return Promise.all([
      prisma.case.findMany({ where: { coordinatorId }, orderBy: { updatedAt: 'desc' }, skip, take }),
      prisma.case.count({ where: { coordinatorId } }),
    ]);
  },
  // Load-based round-robin input: active (non-terminal) case count per coordinator.
  async activeCountByCoordinator(ids: string[]): Promise<Map<string, number>> {
    if (!ids.length) return new Map();
    const rows = await prisma.case.groupBy({
      by: ['coordinatorId'],
      where: { coordinatorId: { in: ids }, status: { notIn: TERMINAL_CASE_STATUSES } },
      _count: { _all: true },
    });
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.coordinatorId) map.set(r.coordinatorId, r._count._all);
    }
    return map;
  },
};

export const intakeRepository = {
  create(data: Prisma.IntakeCreateInput) {
    return prisma.intake.create({ data });
  },
};

export const consentRepository = {
  createMany(rows: Prisma.ConsentCreateInput[]) {
    return prisma.$transaction(rows.map((data) => prisma.consent.create({ data })));
  },
};
