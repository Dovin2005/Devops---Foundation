import { Router } from 'express';
import { ah, validate } from '@ucc/service-kit';
import { createQuoteSchema, generateInvoiceSchema, savePaymentMethodSchema } from '@ucc/types';
import { authenticate, requireRole } from '../middlewares/authenticate.js';
import { billingController } from '../controllers/billing.controller.js';

export const billingRoutes = Router();
billingRoutes.use(authenticate);

const coordinatorPlus = requireRole('coordinator', 'office_manager', 'super_admin');

// Saved payment methods (Stripe Customer + reusable cards) — signed-in users
// only; guests never manage saved cards.
billingRoutes.post('/customer', ah(billingController.getOrCreateCustomer));
billingRoutes.get('/payment-methods', ah(billingController.listPaymentMethods));
billingRoutes.post('/payment-methods', validate(savePaymentMethodSchema), ah(billingController.savePaymentMethod));
billingRoutes.put('/payment-methods/:id/default', ah(billingController.setDefaultPaymentMethod));
billingRoutes.delete('/payment-methods/:id', ah(billingController.deletePaymentMethod));

// Quotes (coordinator builds/sends; patient pays)
billingRoutes.get('/cases/:caseId/quotes', ah(billingController.listQuotes));
billingRoutes.post('/quotes', coordinatorPlus, validate(createQuoteSchema), ah(billingController.createQuote));
billingRoutes.post('/quotes/:id/send', coordinatorPlus, ah(billingController.sendQuote));
billingRoutes.post('/quotes/:id/pay', ah(billingController.payQuote)); // patient (own) or coordinator

// Booking payments (appointment pre-auth lifecycle). Staff capture the hold
// when the visit starts; the pre-auth itself is created via the internal API.
billingRoutes.get('/bookings/:bookingId/payments', ah(billingController.listBookingPayments));
billingRoutes.post('/bookings/:bookingId/capture', requireRole('coordinator', 'office_manager', 'super_admin', 'physician'), ah(billingController.captureBooking));

// Invoices
billingRoutes.get('/invoices', ah(billingController.listInvoices));
billingRoutes.post('/cases/:caseId/invoice', coordinatorPlus, validate(generateInvoiceSchema), ah(billingController.generateInvoice));
billingRoutes.post('/invoices/:id/pay', ah(billingController.payInvoice));
