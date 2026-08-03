import type { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../config/db.js';
import type { Testimonial } from '../models/testimonial.model.js';

// Data-access layer — the only place that talks to Prisma for testimonials.
export const testimonialRepository = {
  list(status?: string): Promise<Testimonial[]> {
    return prisma.testimonial.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string): Promise<Testimonial | null> {
    return prisma.testimonial.findUnique({ where: { id } });
  },

  create(data: Prisma.TestimonialCreateInput): Promise<Testimonial> {
    return prisma.testimonial.create({ data });
  },

  update(id: string, data: Prisma.TestimonialUpdateInput): Promise<Testimonial> {
    return prisma.testimonial.update({ where: { id }, data });
  },

  delete(id: string): Promise<Testimonial> {
    return prisma.testimonial.delete({ where: { id } });
  },
};
