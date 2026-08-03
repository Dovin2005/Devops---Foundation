import type { Request, Response } from 'express';
import { ok, okList, okPage, created, deleted } from '@ucc/service-kit';
import { billingService } from '../services/billing.service.js';
import { bookingPaymentsService } from '../services/bookingPayments.service.js';
import { paymentMethodsService } from '../services/paymentMethods.service.js';

export const billingController = {
  async getOrCreateCustomer(req: Request, res: Response) {
    ok(res, { stripeCustomerId: await paymentMethodsService.getOrCreateCustomer(req.user!.sub) });
  },
  async listPaymentMethods(req: Request, res: Response) {
    okList(res, await paymentMethodsService.listForUser(req.user!.sub));
  },
  async savePaymentMethod(req: Request, res: Response) {
    const { paymentMethodId, makeDefault } = req.body as { paymentMethodId: string; makeDefault?: boolean };
    created(res, await paymentMethodsService.savePaymentMethod(req.user!.sub, paymentMethodId, { makeDefault }));
  },
  async setDefaultPaymentMethod(req: Request, res: Response) {
    ok(res, await paymentMethodsService.setDefault(req.user!.sub, req.params.id!));
  },
  async deletePaymentMethod(req: Request, res: Response) {
    await paymentMethodsService.remove(req.user!.sub, req.params.id!);
    deleted(res);
  },

  async listBookingPayments(req: Request, res: Response) {
    okList(res, await bookingPaymentsService.listForBooking(req.params.bookingId!));
  },
  async captureBooking(req: Request, res: Response) {
    ok(res, await bookingPaymentsService.capture(req.params.bookingId!));
  },
  async createQuote(req: Request, res: Response) {
    created(res, await billingService.createQuote(req.body));
  },
  async sendQuote(req: Request, res: Response) {
    ok(res, await billingService.sendQuote(req.params.id!, req.user!.sub));
  },
  async payQuote(req: Request, res: Response) {
    ok(res, await billingService.payQuote(req.params.id!));
  },
  async listQuotes(req: Request, res: Response) {
    okList(res, await billingService.listQuotesForCase(req.params.caseId!));
  },
  async generateInvoice(req: Request, res: Response) {
    const { patientId, consultPriceUsd } = req.body as { patientId?: string; consultPriceUsd?: number };
    const inv = await billingService.generateCaseInvoice(req.params.caseId!, patientId ?? null, Number(consultPriceUsd) || 0);
    created(res, inv);
  },
  async payInvoice(req: Request, res: Response) {
    ok(res, await billingService.payInvoice(req.params.id!));
  },
  async listInvoices(req: Request, res: Response) {
    const patientId = req.user!.role === 'patient' ? (req.user!.patientId ?? '') : String(req.query.patientId ?? '');
    const [invoices, total] = await billingService.listInvoicesForPatient(patientId);
    okPage(res, invoices, { page: 1, pageSize: 50, totalCount: total });
  },
};
