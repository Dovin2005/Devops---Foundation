import { TtlCache } from '@ucc/service-kit';

// TRM (Tasa Representativa del Mercado) — USD→COP. In production this is fetched
// from the Banco de la República daily; here it's configurable and cached so the
// receipt can snapshot the exact rate used (UCC_19 §A2).
const cache = new TtlCache<number>(60 * 60_000); // 1h

export async function getTrm(): Promise<number> {
  return cache.wrap('trm', async () => Number(process.env.TRM_RATE ?? 4100));
}

export function usdToCop(usd: number, trm: number): number {
  return Math.round(usd * trm);
}
