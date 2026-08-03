import type { Actor } from '@ucc/service-kit';
import type {
  CreateCategoryInput, UpdateCategoryInput,
  CreateServiceOfferingInput, UpdateServiceOfferingInput,
  CreateFaqInput, UpdateFaqInput,
  CreateCareerInput, UpdateCareerInput,
  ContactSubmissionStatus,
} from '@ucc/types';
import { authAdminClient } from '../clients/authAdminClient.js';
import type {
  CategoryDto, ServiceOfferingDto, FaqDto, CareerDto, TestimonialDto, ContactSubmissionDto,
} from '../clients/authAdmin.types.js';

// Pure pass-through to auth-service's internal content API — same shape as
// location.service.ts, grouped into one file since each is a few lines.
export const categoryService = {
  list: (status?: string): Promise<CategoryDto[]> => authAdminClient.content.categories.list(status),
  get: (id: string): Promise<CategoryDto> => authAdminClient.content.categories.findById(id),
  create: (input: CreateCategoryInput, actor: Actor): Promise<CategoryDto> => authAdminClient.content.categories.create(input, actor),
  update: (id: string, input: UpdateCategoryInput, actor: Actor): Promise<CategoryDto> => authAdminClient.content.categories.update(id, input, actor),
  remove: (id: string, hard: boolean, actor: Actor): Promise<CategoryDto> => authAdminClient.content.categories.remove(id, hard, actor),
};

export const serviceOfferingService = {
  list: (status?: string): Promise<ServiceOfferingDto[]> => authAdminClient.content.services.list(status),
  get: (id: string): Promise<ServiceOfferingDto> => authAdminClient.content.services.findById(id),
  create: (input: CreateServiceOfferingInput, actor: Actor): Promise<ServiceOfferingDto> => authAdminClient.content.services.create(input, actor),
  update: (id: string, input: UpdateServiceOfferingInput, actor: Actor): Promise<ServiceOfferingDto> => authAdminClient.content.services.update(id, input, actor),
  remove: (id: string, actor: Actor): Promise<null> => authAdminClient.content.services.remove(id, actor),
};

export const faqService = {
  list: (status?: string): Promise<FaqDto[]> => authAdminClient.content.faqs.list(status),
  get: (id: string): Promise<FaqDto> => authAdminClient.content.faqs.findById(id),
  create: (input: CreateFaqInput, actor: Actor): Promise<FaqDto> => authAdminClient.content.faqs.create(input, actor),
  update: (id: string, input: UpdateFaqInput, actor: Actor): Promise<FaqDto> => authAdminClient.content.faqs.update(id, input, actor),
  remove: (id: string, actor: Actor): Promise<null> => authAdminClient.content.faqs.remove(id, actor),
};

export const careerService = {
  list: (status?: string): Promise<CareerDto[]> => authAdminClient.content.careers.list(status),
  get: (id: string): Promise<CareerDto> => authAdminClient.content.careers.findById(id),
  create: (input: CreateCareerInput, actor: Actor): Promise<CareerDto> => authAdminClient.content.careers.create(input, actor),
  update: (id: string, input: UpdateCareerInput, actor: Actor): Promise<CareerDto> => authAdminClient.content.careers.update(id, input, actor),
  remove: (id: string, actor: Actor): Promise<null> => authAdminClient.content.careers.remove(id, actor),
};

export const testimonialService = {
  list: (status?: string): Promise<TestimonialDto[]> => authAdminClient.content.testimonials.list(status),
  approve: (id: string, actor: Actor): Promise<TestimonialDto> => authAdminClient.content.testimonials.approve(id, actor),
  reject: (id: string, actor: Actor): Promise<TestimonialDto> => authAdminClient.content.testimonials.reject(id, actor),
  remove: (id: string, actor: Actor): Promise<null> => authAdminClient.content.testimonials.remove(id, actor),
};

export const contactSubmissionService = {
  list: (status?: string): Promise<ContactSubmissionDto[]> => authAdminClient.content.contactSubmissions.list(status),
  updateStatus: (id: string, status: ContactSubmissionStatus, actor: Actor): Promise<ContactSubmissionDto> =>
    authAdminClient.content.contactSubmissions.updateStatus(id, status, actor),
  remove: (id: string, actor: Actor): Promise<null> => authAdminClient.content.contactSubmissions.remove(id, actor),
};
