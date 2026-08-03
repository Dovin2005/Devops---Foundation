import { HttpError } from '@ucc/service-kit';
import type { CreateQuoteInput } from '@ucc/types';
import { quoteRepository, invoiceRepository, paymentRepository } from '../repositories/billing.repository.js';
import { getTrm, usdToCop } from '../config/trm.js';
import { paymentGateway, einvoice } from '../adapters/index.js';
import type { QuoteLine } from '../models/quote.model.js';

const REVIEW_THRESHOLD_USD = 120; // large quotes flag for coordinator/OM review (A-07)

let invCounter = 0;
async function nextInvoiceNumber(): Promise<string> {
  const base = await invoiceRepository.count();
  invCounter += 1;
  return `UCC-${new Date().getFullYear()}-${String(base + invCounter).padStart(5, '0')}`;
}

export const billingService = {
  // Stage 9 — coordinator builds a quote (catalog + markup). Prices USD; COP
  // snapshot at the day's TRM. Above the threshold → pending_review.
  async createQuote(input: CreateQuoteInput) {
    const trm = await getTrm();
    const lines = input.lines.map((l) => ({
      label: l.label, catalogPriceUsd: l.catalogPriceUsd, markupPct: l.markupPct,
      totalUsd: Math.round(l.catalogPriceUsd * (1 + l.markupPct / 100) * 100) / 100,
    }));
    const totalUsd = lines.reduce((s, l) => s + l.totalUsd, 0);
    const status = totalUsd >= REVIEW_THRESHOLD_USD ? 'pending_review' : 'draft';
    return quoteRepository.create({
      caseId: input.caseId, patientId: input.patientId ?? null, orderIds: input.orderIds ?? [],
      lines, totalUsd: totalUsd.toFixed(2), totalCop: usdToCop(totalUsd, trm).toFixed(2),
      trmRate: trm.toFixed(2), status,
    });
  },

  async sendQuote(id: string, reviewedBy: string) {
    const q = await quoteRepository.findById(id);
    if (!q) throw new HttpError(404, 'Quote not found');
    q.status = 'sent'; q.sentAt = new Date(); q.reviewedBy = reviewedBy;
    return quoteRepository.save(q);
  },

  // Patient accepts & pays → capture in COP. Idempotency guards double-charge.
  async payQuote(id: string) {
    const q = await quoteRepository.findById(id);
    if (!q) throw new HttpError(404, 'Quote not found');
    if (q.status !== 'sent' && q.status !== 'accepted') throw new HttpError(409, `Quote is ${q.status}`);
    const amountCop = Number(q.totalCop);
    const idemKey = `quote-${q.id}`;
    if (!(await paymentRepository.findByIdemKey(idemKey))) {
      const cap = await paymentGateway.capture(amountCop);
      await paymentRepository.create({ caseId: q.caseId, quoteId: q.id, patientId: q.patientId, type: 'capture', amountCop: amountCop.toFixed(2), gatewayRef: cap.gatewayRef, idemKey, status: 'approved' });
    }
    q.status = 'paid';
    return quoteRepository.save(q);
  },

  // Stage 12 — invoice from the consult fee + all paid quote lines. DIAN CUFE.
  async generateCaseInvoice(caseId: string, patientId: string | null, consultPriceUsd: number) {
    const trm = await getTrm();
    const lines: Array<{ label: string; qty: number; unitPriceCop: number; totalCop: number }> = [];
    if (consultPriceUsd > 0) {
      const cop = usdToCop(consultPriceUsd, trm);
      lines.push({ label: 'Consultation', qty: 1, unitPriceCop: cop, totalCop: cop });
    }
    for (const q of await quoteRepository.paidByCase(caseId)) {
      for (const l of q.lines as unknown as QuoteLine[]) {
        const cop = usdToCop(l.totalUsd, trm);
        lines.push({ label: l.label, qty: 1, unitPriceCop: cop, totalCop: cop });
      }
    }
    const subtotalCop = lines.reduce((s, l) => s + l.totalCop, 0);
    const totalUsd = subtotalCop / trm;
    const number = await nextInvoiceNumber();
    const dian = await einvoice.issue(number);
    return invoiceRepository.create({
      caseId, patientId, number, lines,
      subtotalCop: subtotalCop.toFixed(2), totalCop: subtotalCop.toFixed(2),
      totalUsd: totalUsd.toFixed(2), trmRate: trm.toFixed(2),
      status: 'issued', cufe: dian.cufe,
    });
  },

  async payInvoice(id: string) {
    const inv = await invoiceRepository.findById(id);
    if (!inv) throw new HttpError(404, 'Invoice not found');
    if (inv.status === 'paid') throw new HttpError(409, 'Invoice already paid');
    const amountCop = Number(inv.totalCop);
    const idemKey = `invoice-${inv.id}`;
    const cap = await paymentGateway.capture(amountCop);
    const pay = await paymentRepository.create({ caseId: inv.caseId, invoiceId: inv.id, patientId: inv.patientId, type: 'capture', amountCop: amountCop.toFixed(2), gatewayRef: cap.gatewayRef, idemKey, status: 'approved' });
    inv.status = 'paid'; inv.paidAt = new Date(); inv.paymentId = pay.id;
    return invoiceRepository.save(inv);
  },

  listInvoicesForPatient(patientId: string) {
    return invoiceRepository.listByPatient(patientId);
  },
  listQuotesForCase(caseId: string) {
    return quoteRepository.listByCase(caseId);
  },
};
