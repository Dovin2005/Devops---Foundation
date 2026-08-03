import type { Response } from 'express';
import { defaultMessageFor } from './httpStatus.js';

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface Envelope<T> {
  status: number;
  message: string;
  validation: ValidationIssue[] | null;
  totalCount: number | null;
  data: T;
}

// Core primitive — every helper below funnels through this so there's exactly
// one place that assembles the envelope shape.
export function send<T>(
  res: Response,
  status: number,
  data: T,
  opts: { message?: string; totalCount?: number | null; validation?: ValidationIssue[] | null } = {},
): void {
  const body: Envelope<T> = {
    status,
    message: opts.message ?? defaultMessageFor(status),
    validation: opts.validation ?? null,
    totalCount: opts.totalCount ?? null,
    data,
  };
  res.status(status).json(body);
}

// 200 — single entity / raw payload, no list semantics.
export const ok = <T>(res: Response, data: T, message?: string) => send(res, 200, data, { message });

// 200 — list payload. totalCount defaults to the returned array's length;
// pass an explicit totalCount for endpoints with a true DB total distinct
// from the page actually returned (see okPage for those).
export const okList = <T>(res: Response, data: readonly T[], opts: { message?: string; totalCount?: number } = {}) =>
  send(res, 200, data, { message: opts.message, totalCount: opts.totalCount ?? data.length });

// 200 — paginated list. `data` carries the page + its paging params;
// `totalCount` (top-level) carries the true DB total across all pages.
export const okPage = <T>(
  res: Response,
  items: readonly T[],
  opts: { page: number; pageSize: number; totalCount: number; message?: string },
) => send(res, 200, { items, page: opts.page, pageSize: opts.pageSize }, { message: opts.message, totalCount: opts.totalCount });

// 201 — created.
export const created = <T>(res: Response, data: T, message?: string) => send(res, 201, data, { message });

// Former bare `res.status(204).send()` hard-deletes now respond 200 with an
// envelope body (204 can't legally carry JSON). `data` is always null.
export const deleted = (res: Response, message = 'Deleted') => send(res, 200, null, { message });
