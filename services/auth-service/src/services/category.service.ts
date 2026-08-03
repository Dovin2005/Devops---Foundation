import { HttpError, type Actor } from '@ucc/service-kit';
import type { CreateCategoryInput, UpdateCategoryInput } from '@ucc/types';
import { categoryRepository } from '../repositories/category.repository.js';
import type { Category } from '../models/category.model.js';
import { auditService } from './audit.service.js';

export const categoryService = {
  list(status?: string): Promise<Category[]> {
    return categoryRepository.list(status);
  },

  async get(id: string): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (!category) throw new HttpError(404, 'Category not found');
    return category;
  },

  async create(input: CreateCategoryInput, actor: Actor): Promise<Category> {
    const category = await categoryRepository.create(input);
    await auditService.record(actor, 'category.create', 'category', category.id, { name: category.name });
    return category;
  },

  async update(id: string, input: UpdateCategoryInput, actor: Actor): Promise<Category> {
    await this.get(id);
    const category = await categoryRepository.update(id, input);
    await auditService.record(actor, 'category.update', 'category', id, { fields: Object.keys(input) });
    return category;
  },

  // Default delete deactivates — providers may still reference a category's
  // id. ?hard=true removes the row permanently.
  async remove(id: string, hard: boolean, actor: Actor): Promise<Category> {
    const existing = await this.get(id);
    if (hard) {
      const removed = await categoryRepository.delete(id);
      await auditService.record(actor, 'category.delete', 'category', id, { name: existing.name, hard: true });
      return removed;
    }
    const deactivated = await categoryRepository.update(id, { status: 'inactive' });
    await auditService.record(actor, 'category.deactivate', 'category', id, { name: existing.name });
    return deactivated;
  },
};
