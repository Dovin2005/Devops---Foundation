import { TtlCache } from '@ucc/service-kit';
import { providerRepository } from '../repositories/provider.repository.js';
import type { Provider } from '../models/provider.model.js';

// Provider lists are read-mostly → cache for 60s to keep the "find a doctor"
// and booking screens fast under load.
const cache = new TtlCache<Provider[]>(60_000);

export interface CreateProviderProfileInput {
  userId: string;
  firstName: string;
  lastName: string;
  type?: string;
  specialtyIds?: string[];
  specialtyNames?: string[];
  city?: string;
  modes?: string[];
  languages?: string[];
  active?: boolean;
}

export const providerService = {
  list(filter: { city?: string; categoryId?: string; modality?: string }) {
    const key = `providers:${filter.city ?? ''}:${filter.categoryId ?? ''}:${filter.modality ?? ''}`;
    return cache.wrap(key, () => providerRepository.list(filter));
  },
  get(id: string) {
    return providerRepository.findById(id);
  },
  invalidate() {
    cache.clear();
  },

  // Internal-only (called from auth-service when an admin creates a physician).
  async create(input: CreateProviderProfileInput): Promise<Provider> {
    const provider = await providerRepository.create({
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName,
      ...(input.type ? { type: input.type } : {}),
      specialtyIds: input.specialtyIds ?? [],
      specialtyNames: input.specialtyNames ?? [],
      ...(input.city ? { city: input.city } : {}),
      modes: input.modes ?? [],
      languages: input.languages ?? [],
      active: input.active ?? true,
    });
    this.invalidate();
    return provider;
  },
};
