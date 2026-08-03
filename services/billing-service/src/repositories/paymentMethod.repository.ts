import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { PaymentMethod } from '../models/paymentMethod.model.js';

// Data-access layer — the only place that talks to Prisma for saved payment methods.
export const paymentMethodRepository = {
  create(data: Prisma.PaymentMethodCreateInput): Promise<PaymentMethod> {
    return prisma.paymentMethod.create({ data });
  },
  findById(id: string): Promise<PaymentMethod | null> {
    return prisma.paymentMethod.findUnique({ where: { id } });
  },
  findByStripeId(stripePaymentMethodId: string): Promise<PaymentMethod | null> {
    return prisma.paymentMethod.findUnique({ where: { stripePaymentMethodId } });
  },
  listByUser(userId: string): Promise<PaymentMethod[]> {
    return prisma.paymentMethod.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  },
  async delete(id: string): Promise<void> {
    await prisma.paymentMethod.delete({ where: { id } });
  },
  // Exactly one default per user — clear the rest, then set the target, in
  // one transaction.
  async setDefault(userId: string, id: string): Promise<PaymentMethod> {
    const [, updated] = await prisma.$transaction([
      prisma.paymentMethod.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
      prisma.paymentMethod.update({ where: { id }, data: { isDefault: true } }),
    ]);
    return updated;
  },
};
