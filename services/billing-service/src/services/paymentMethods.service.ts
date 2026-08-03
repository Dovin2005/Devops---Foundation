import { HttpError } from '@ucc/service-kit';
import { paymentMethodRepository } from '../repositories/paymentMethod.repository.js';
import { stripeCustomers } from '../adapters/stripeCustomers.js';
import { authInternalClient } from '../clients/authInternalClient.js';
import type { PaymentMethod } from '../models/paymentMethod.model.js';

async function ownedOrThrow(userId: string, id: string): Promise<PaymentMethod> {
  const pm = await paymentMethodRepository.findById(id);
  if (!pm || pm.userId !== userId) throw new HttpError(404, 'Payment method not found');
  return pm;
}

export const paymentMethodsService = {
  // Resolves the caller's Stripe Customer, creating one (and persisting it on
  // their `users` row via auth-service) the first time they save a card.
  async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await authInternalClient.getStripeCustomer(userId);
    if (user.stripeCustomerId) return user.stripeCustomerId;
    const customerId = await stripeCustomers.create({ email: user.email, name: user.name, metadata: { userId } });
    await authInternalClient.setStripeCustomer(userId, customerId);
    return customerId;
  },

  async savePaymentMethod(userId: string, stripePaymentMethodId: string, opts: { makeDefault?: boolean } = {}): Promise<PaymentMethod> {
    const existing = await paymentMethodRepository.findByStripeId(stripePaymentMethodId);
    if (existing) {
      if (existing.userId !== userId) throw new HttpError(409, 'That card is already saved to a different account');
      if (opts.makeDefault && !existing.isDefault) return paymentMethodRepository.setDefault(userId, existing.id);
      return existing; // idempotent re-save
    }

    const customerId = await paymentMethodsService.getOrCreateCustomer(userId);
    const card = await stripeCustomers.attachPaymentMethod(customerId, stripePaymentMethodId);
    const isFirstCard = (await paymentMethodRepository.listByUser(userId)).length === 0;
    const created = await paymentMethodRepository.create({
      userId,
      stripePaymentMethodId,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.expMonth,
      expYear: card.expYear,
      isDefault: false,
    });
    if (opts.makeDefault || isFirstCard) {
      await stripeCustomers.setDefaultPaymentMethod(customerId, stripePaymentMethodId);
      return paymentMethodRepository.setDefault(userId, created.id);
    }
    return created;
  },

  listForUser(userId: string): Promise<PaymentMethod[]> {
    return paymentMethodRepository.listByUser(userId);
  },

  async setDefault(userId: string, id: string): Promise<PaymentMethod> {
    const pm = await ownedOrThrow(userId, id);
    const customerId = await paymentMethodsService.getOrCreateCustomer(userId);
    await stripeCustomers.setDefaultPaymentMethod(customerId, pm.stripePaymentMethodId);
    return paymentMethodRepository.setDefault(userId, id);
  },

  async remove(userId: string, id: string): Promise<void> {
    const pm = await ownedOrThrow(userId, id);
    await stripeCustomers.detachPaymentMethod(pm.stripePaymentMethodId);
    await paymentMethodRepository.delete(id);
  },
};
