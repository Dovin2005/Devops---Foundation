import { HttpError, type Actor } from '@ucc/service-kit';
import type { CreateServiceOfferingInput, UpdateServiceOfferingInput } from '@ucc/types';
import { serviceOfferingRepository } from '../repositories/serviceOffering.repository.js';
import type { ServiceOffering } from '../models/serviceOffering.model.js';
import { auditService } from './audit.service.js';

export const serviceOfferingService = {
  list(status?: string): Promise<ServiceOffering[]> {
    return serviceOfferingRepository.list(status);
  },

  async get(id: string): Promise<ServiceOffering> {
    const service = await serviceOfferingRepository.findById(id);
    if (!service) throw new HttpError(404, 'Service not found');
    return service;
  },

  async create(input: CreateServiceOfferingInput, actor: Actor): Promise<ServiceOffering> {
    const service = await serviceOfferingRepository.create(input);
    await auditService.record(actor, 'service.create', 'service_offering', service.id, { title: service.title });
    return service;
  },

  async update(id: string, input: UpdateServiceOfferingInput, actor: Actor): Promise<ServiceOffering> {
    await this.get(id);
    const service = await serviceOfferingRepository.update(id, input);
    await auditService.record(actor, 'service.update', 'service_offering', id, { fields: Object.keys(input) });
    return service;
  },

  async remove(id: string, actor: Actor): Promise<void> {
    const existing = await this.get(id);
    await serviceOfferingRepository.delete(id);
    await auditService.record(actor, 'service.delete', 'service_offering', id, { title: existing.title });
  },
};
