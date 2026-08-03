import { HttpError, type Actor } from '@ucc/service-kit';
import type { CreateLocationInput, UpdateLocationInput } from '@ucc/types';
import type { Prisma } from '../generated/prisma/index.js';
import { locationRepository } from '../repositories/location.repository.js';
import type { Location } from '../models/location.model.js';
import { auditService } from './audit.service.js';

// "09:00" -> "9:00 AM"
function formatTime(hhmm: string): string {
  const parts = hhmm.split(':');
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// "09:00", "21:00" -> "9:00 AM - 9:00 PM"; null if either side of the range
// isn't set, so the frontend can fall back to "Hours not listed".
function formatHours(openTime: string | null, closeTime: string | null): string | null {
  if (!openTime || !closeTime) return null;
  return `${formatTime(openTime)} - ${formatTime(closeTime)}`;
}

export const locationService = {
  list(status?: string): Promise<Location[]> {
    return locationRepository.list(status);
  },

  // Public marketing-site listing — adds a human-readable `hours` string
  // ("9:00 AM - 9:00 PM") alongside the raw openTime/closeTime.
  async listPublic(status?: string): Promise<Array<Location & { hours: string | null }>> {
    const locations = await locationRepository.list(status);
    return locations.map((location) => ({ ...location, hours: formatHours(location.openTime, location.closeTime) }));
  },

  async get(id: string): Promise<Location> {
    const location = await locationRepository.findById(id);
    if (!location) throw new HttpError(404, 'Location not found');
    return location;
  },

  async create(input: CreateLocationInput, actor: Actor): Promise<Location> {
    const location = await locationRepository.create({
      ...input,
      settings: (input.settings ?? {}) as Prisma.InputJsonValue,
    });
    await auditService.record(actor, 'location.create', 'location', location.id, { city: location.city, name: location.name });
    return location;
  },

  async update(id: string, input: UpdateLocationInput, actor: Actor): Promise<Location> {
    await this.get(id);
    const { settings, ...rest } = input;
    const location = await locationRepository.update(id, {
      ...rest,
      ...(settings !== undefined ? { settings: settings as Prisma.InputJsonValue } : {}),
    });
    await auditService.record(actor, 'location.update', 'location', id, { fields: Object.keys(input) });
    return location;
  },

  // Default delete is a deactivation (error prevention — cases/staff may still
  // reference the location). ?hard=true removes the row permanently.
  async remove(id: string, hard: boolean, actor: Actor): Promise<Location> {
    const existing = await this.get(id);
    if (hard) {
      const removed = await locationRepository.delete(id);
      await auditService.record(actor, 'location.delete', 'location', id, { city: existing.city, name: existing.name, hard: true });
      return removed;
    }
    const deactivated = await locationRepository.update(id, { status: 'inactive' });
    await auditService.record(actor, 'location.deactivate', 'location', id, { city: existing.city, name: existing.name });
    return deactivated;
  },
};
