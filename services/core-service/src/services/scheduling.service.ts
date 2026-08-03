import { HttpError } from '@ucc/service-kit';
import {
  CONSENT_TRIO, MODALITY_PRICE_USD,
  type BookAppointmentInput, type IntakeInput, type JwtClaims, type PayBookingInput, type VisitType,
} from '@ucc/types';
import { providerRepository } from '../repositories/provider.repository.js';
import { patientRepository } from '../repositories/patient.repository.js';
import {
  bookingRepository, caseRepository, intakeRepository, consentRepository,
} from '../repositories/booking.repository.js';
import { assignmentService } from './assignment.service.js';
import { billingClient } from '../clients/billingClient.js';
import type { Booking } from '../models/booking.model.js';

const HOLD_MINUTES = 10; // slot hold TTL (UCC_19 §A1)

// Booking wizard order: consultation option → when + doctor (hold) → intake →
// payment (Stripe pre-auth, captured when the visit starts) → confirmed.
// Guests supply contact + persons; registered patients just pick the details —
// identity comes from their JWT and their patient record fills the rest.

async function loadActive(id: string): Promise<Booking> {
  const b = await bookingRepository.findById(id);
  if (!b) throw new HttpError(404, 'Booking not found');
  if (b.status === 'held' && b.heldUntil < new Date()) {
    b.status = 'expired';
    await bookingRepository.save(b);
    throw new HttpError(410, 'The slot hold expired — please pick a time again');
  }
  return b;
}

export const schedulingService = {
  // Booking API — consultation option + when + doctor + intake in one call.
  // The slot is reserved (10-min hold) at the moment the whole form, intake
  // answers, and consents are submitted. Guests must sign the consent trio.
  async book(input: BookAppointmentInput, user?: JwtClaims): Promise<Booking> {
    const patientId = user?.role === 'patient' ? user.patientId ?? null : null;
    const guestFlag = !patientId;

    let persons = input.persons ?? [];
    let guestEmail = input.guest?.email ?? null;
    if (patientId) {
      const patient = await patientRepository.findById(patientId);
      if (!patient) throw new HttpError(404, 'Patient record not found for this account');
      if (!persons.length) persons = [{ firstName: patient.firstName, lastName: patient.lastName }];
      guestEmail = guestEmail ?? patient.email; // receipt / confirmation email
    } else {
      if (!input.guest?.email) throw new HttpError(422, 'Guest bookings need contact details (guest.email) — or sign in first');
      if (!persons.length) throw new HttpError(422, 'Guest bookings need at least one person');
      const signed = new Set(input.intake.consents.map((c) => c.type));
      const missing = CONSENT_TRIO.filter((t) => !signed.has(t));
      if (missing.length) throw new HttpError(422, `Missing required consent: ${missing.join(', ')}`);
    }

    let providerId = input.providerId ?? null;
    if (providerId) {
      const p = await providerRepository.findById(providerId);
      if (!p || !p.active) throw new HttpError(404, 'Doctor not found');
      if (!p.modes.includes(input.modality)) {
        throw new HttpError(422, `That doctor does not offer ${input.modality} consultations`);
      }
    } else {
      const p = await providerRepository.firstAvailable({ city: input.city, modality: input.modality });
      providerId = p?.id ?? null;
    }
    if (providerId && (await bookingRepository.slotTaken(providerId, new Date(input.slotStart)))) {
      throw new HttpError(409, 'That slot was just taken — please pick the nearest alternative');
    }

    const booking = await bookingRepository.create({
      guestFlag,
      guestEmail,
      guestPhone: input.guest?.phone ?? null,
      patientId,
      serviceCode: input.serviceCode,
      modality: input.modality,
      city: input.city ?? null,
      providerId,
      slotStart: new Date(input.slotStart),
      persons,
      amountUsd: MODALITY_PRICE_USD[input.modality as VisitType].toFixed(2),
      status: 'held',
      heldUntil: new Date(Date.now() + HOLD_MINUTES * 60_000),
      intakeData: input.intake as object,
      intakeStatus: 'complete',
    });

    await consentRepository.createMany(
      input.intake.consents.map((c) => ({
        bookingId: booking.id, patientId, type: c.type, signedBy: c.signedBy,
      })),
    );

    return booking;
  },

  // Payment & Confirmation API — Stripe pre-auth via billing-service (captured
  // when the visit starts). On approval the booking confirms, gets its UCC
  // number, and the case + intake are created and routed to a coordinator.
  // The response already carries everything a confirmation screen needs, so
  // no follow-up "get booking" call is required.
  async pay(id: string, input: PayBookingInput, user?: JwtClaims) {
    const b = await loadActive(id);
    if (b.status === 'confirmed') throw new HttpError(409, 'Booking is already paid and confirmed');
    if (b.status !== 'held') throw new HttpError(409, `Booking is ${b.status}`);

    const { payment, customerId } = await billingClient.preauthorize({
      bookingId: b.id,
      patientId: b.patientId,
      userId: user?.sub ?? null,
      amountUsd: Number(b.amountUsd),
      currency: input.currency,
      paymentMethodId: input.paymentMethodId,
      savePaymentMethod: input.savePaymentMethod,
      customerEmail: b.guestEmail,
      guestStripeCustomerId: b.guestStripeCustomerId,
      description: `UCC ${b.modality} consultation on ${b.slotStart.toISOString()}`,
    });
    if (!user && customerId) b.guestStripeCustomerId = customerId; // carried forward on registration
    if (payment.status !== 'approved') {
      b.preauthStatus = 'declined';
      await bookingRepository.save(b);
      throw new HttpError(402, 'Payment was declined — please try another card');
    }

    b.preauthRef = payment.gatewayRef;
    b.preauthStatus = 'approved';
    b.currency = input.currency;
    const count = await bookingRepository.countConfirmed();
    b.number = `UCC-${String(count + 1).padStart(4, '0')}`;
    b.status = 'confirmed';
    await bookingRepository.save(b);

    const intake = (b.intakeData ?? {}) as IntakeInput;
    const kase = await caseRepository.create({
      bookingId: b.id,
      patientId: b.patientId,
      providerId: b.providerId,
      modality: b.modality,
      serviceCode: b.serviceCode,
      reason: intake.reason ?? null,
      status: 'booked',
      stage: 3,
    });
    if (intake.reason) {
      await intakeRepository.create({
        caseId: kase.id,
        reason: intake.reason,
        goals: intake.goals ?? null,
        bodyAreas: intake.bodyAreas ?? [],
        onset: intake.onset ?? null,
        severity: intake.severity ?? null,
        hasFever: intake.hasFever ?? null,
        takingMedication: intake.takingMedication ?? null,
      });
    }

    // Coordinator round-robin (best-effort; assigns later if auth is unreachable).
    // WhatsApp confirmation is dispatched by comms-service off the booking event.
    const coordinatorId = await assignmentService.assign(kase, b.city);

    return { booking: b, case: kase, payment, coordinatorId };
  },

  // Cancel a held or confirmed booking; a confirmed booking's pre-auth is
  // released (best-effort — the hold also falls off on its own if unreachable).
  async cancel(id: string): Promise<Booking> {
    const b = await bookingRepository.findById(id);
    if (!b) throw new HttpError(404, 'Booking not found');
    if (b.status === 'cancelled') return b;
    if (!['held', 'confirmed', 'expired'].includes(b.status)) throw new HttpError(409, `Booking is ${b.status}`);

    if (b.preauthStatus === 'approved') {
      try {
        await billingClient.cancel(b.id);
      } catch {
        // billing unreachable — the pre-auth expires on its own; don't block the cancel
      }
    }
    b.status = 'cancelled';
    return bookingRepository.save(b);
  },

  // "My appointments" for a signed-in patient.
  listForPatient(patientId: string) {
    return bookingRepository.listByPatient(patientId);
  },
};
