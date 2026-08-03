import { Router } from 'express';
import { ah, validate } from '@ucc/service-kit';
import { bookAppointmentSchema, payBookingSchema } from '@ucc/types';
import { bookingsController } from '../controllers/bookings.controller.js';
import { authenticate, optionalAuthenticate } from '../middlewares/authenticate.js';

// Appointment booking wizard. Public — a visitor books without an account; a
// signed-in patient sends the same requests with a Bearer token and skips the
// guest fields. Two calls: book (slot + intake) → pay (pre-auth + confirmation).
export const bookingsRoutes = Router();
bookingsRoutes.get('/consultation-options', ah(bookingsController.consultationOptions));
bookingsRoutes.get('/bookings/mine', authenticate, ah(bookingsController.listMine));
bookingsRoutes.post('/bookings', optionalAuthenticate, validate(bookAppointmentSchema), ah(bookingsController.book));
bookingsRoutes.post('/bookings/:id/pay', optionalAuthenticate, validate(payBookingSchema), ah(bookingsController.pay));
bookingsRoutes.post('/bookings/:id/cancel', ah(bookingsController.cancel));
