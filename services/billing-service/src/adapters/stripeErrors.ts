import Stripe from 'stripe';
import { HttpError } from '@ucc/service-kit';

export function asHttpError(e: unknown): never {
  if (e instanceof Stripe.errors.StripeCardError) throw new HttpError(402, e.message);
  if (e instanceof Stripe.errors.StripeInvalidRequestError) throw new HttpError(422, e.message);
  throw e;
}
