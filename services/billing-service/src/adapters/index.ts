import crypto from 'node:crypto';

// Vendor adapters — Phase-0 blocking decisions ship as mocks behind stable
// interfaces (payment gateway = Wompi/PlaceToPay; DIAN e-invoice provider).
const ref = (p: string) => `${p}_${crypto.randomBytes(8).toString('hex')}`;

export const paymentGateway = {
  provider: process.env.PAYMENT_PROVIDER ?? 'mock',
  async preauth(amountCop: number) { return { gatewayRef: ref('pre'), status: 'approved' as const, amountCop }; },
  async capture(amountCop: number) { return { gatewayRef: ref('cap'), status: 'approved' as const, amountCop }; },
  async refund(amountCop: number) { return { gatewayRef: ref('ref'), status: 'refunded' as const, amountCop }; },
  async tokenizeCard(last4 = '4242', brand = 'VISA') { return { token: ref('tok'), brand, last4 }; },
};

export const einvoice = {
  provider: process.env.EINVOICE_PROVIDER ?? 'mock',
  async issue(invoiceNumber: string) {
    return { cufe: ref('CUFE').toUpperCase(), xmlRef: `xml/${invoiceNumber}.xml` };
  },
};
