import { errorHandler as makeErrorHandler, notFound } from '@ucc/service-kit';

export const errorHandler = makeErrorHandler('auth-service');
export { notFound };
