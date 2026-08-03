import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { Quote } from '../models/quote.model.js';
import type { Invoice } from '../models/invoice.model.js';
import type { Payment } from '../models/payment.model.js';

// Data-access layer — the only place that talks to Prisma for quotes/invoices/payments.
export const quoteRepository = {
  create(data: Prisma.QuoteCreateInput): Promise<Quote> {
    return prisma.quote.create({ data });
  },
  findById(id: string): Promise<Quote | null> {
    return prisma.quote.findUnique({ where: { id } });
  },
  save(q: Quote): Promise<Quote> {
    const { id, createdAt, ...data } = q;
    return prisma.quote.update({ where: { id }, data: data as Prisma.QuoteUpdateInput });
  },
  listByCase(caseId: string): Promise<Quote[]> {
    return prisma.quote.findMany({ where: { caseId }, orderBy: { createdAt: 'desc' } });
  },
  paidByCase(caseId: string): Promise<Quote[]> {
    return prisma.quote.findMany({ where: { caseId, status: 'paid' } });
  },
};

export const invoiceRepository = {
  create(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
    return prisma.invoice.create({ data });
  },
  findById(id: string): Promise<Invoice | null> {
    return prisma.invoice.findUnique({ where: { id } });
  },
  save(i: Invoice): Promise<Invoice> {
    const { id, createdAt, ...data } = i;
    return prisma.invoice.update({ where: { id }, data: data as Prisma.InvoiceUpdateInput });
  },
  listByPatient(patientId: string, skip = 0, take = 50): Promise<[Invoice[], number]> {
    return Promise.all([
      prisma.invoice.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.invoice.count({ where: { patientId } }),
    ]);
  },
  count(): Promise<number> {
    return prisma.invoice.count();
  },
};

export const paymentRepository = {
  create(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return prisma.payment.create({ data });
  },
  findByIdemKey(idemKey: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { idemKey } });
  },
  findByGatewayRef(gatewayRef: string): Promise<Payment | null> {
    return prisma.payment.findFirst({ where: { gatewayRef }, orderBy: { createdAt: 'desc' } });
  },
  save(p: Payment): Promise<Payment> {
    const { id, createdAt, ...data } = p;
    return prisma.payment.update({ where: { id }, data: data as Prisma.PaymentUpdateInput });
  },
  listByBooking(bookingId: string): Promise<Payment[]> {
    return prisma.payment.findMany({ where: { bookingId }, orderBy: { createdAt: 'desc' } });
  },
};
