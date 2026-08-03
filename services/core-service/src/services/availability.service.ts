import { HttpError } from '@ucc/service-kit';
import { providerRepository } from '../repositories/provider.repository.js';
import { bookingRepository } from '../repositories/booking.repository.js';

interface DaySlots {
  date: string;
  slots: Array<{ start: string; available: boolean }>;
}

// Computed availability: a business-hours grid (09:00–17:00, 30-min) for the
// next N days minus already-taken slots. Cheap and deterministic; a real
// calendar/Google-sync integration slots in behind this shape later.
export const availabilityService = {
  async forProvider(providerId: string, days = 7): Promise<DaySlots[]> {
    const provider = await providerRepository.findById(providerId);
    if (!provider) throw new HttpError(404, 'Provider not found');
    const taken = await bookingRepository.takenSlots(providerId);

    const out: DaySlots[] = [];
    for (let d = 1; d <= days; d++) {
      const day = new Date();
      day.setDate(day.getDate() + d);
      const slots: DaySlots['slots'] = [];
      for (let h = 9; h < 17; h++) {
        for (const m of [0, 30]) {
          const s = new Date(day);
          s.setHours(h, m, 0, 0);
          slots.push({ start: s.toISOString(), available: !taken.has(s.getTime()) });
        }
      }
      out.push({ date: day.toISOString().slice(0, 10), slots });
    }
    return out;
  },
};
