import type { Request, Response } from 'express';
import { HttpError, ok } from '@ucc/service-kit';
import { userRepository } from '../repositories/user.repository.js';

// Service-to-service only (billing-service) — resolves/persists the Stripe
// Customer id for a user. Not reachable via a user JWT.
export const internalUsersController = {
  async getStripeCustomer(req: Request, res: Response) {
    const user = await userRepository.findById(req.params.id!);
    if (!user) throw new HttpError(404, 'User not found');
    ok(res, { stripeCustomerId: user.stripeCustomerId, email: user.email, name: `${user.firstName} ${user.lastName}` });
  },

  async setStripeCustomer(req: Request, res: Response) {
    const { stripeCustomerId } = req.body as { stripeCustomerId: string };
    const user = await userRepository.update(req.params.id!, { stripeCustomerId });
    ok(res, { stripeCustomerId: user.stripeCustomerId });
  },
};
