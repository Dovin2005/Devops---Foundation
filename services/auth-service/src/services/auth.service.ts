import bcrypt from 'bcryptjs';
import { HttpError, type Actor } from '@ucc/service-kit';
import type { AdminCreateUserInput, LoginInput, RegisterInput, PublicUser, Role, OtpPurpose, PermissionMatrix, ContactOption } from '@ucc/types';
import { userRepository } from '../repositories/user.repository.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { roleConfigRepository } from '../repositories/roleConfig.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { toPublicUser } from '../models/user.model.js';
import type { User } from '../models/user.model.js';
import { signAccess, signRefresh, verifyRefresh, hashToken } from '../utils/jwt.js';
import { maskEmail, maskPhone } from '../utils/mask.js';
import { coreClient } from '../clients/coreClient.js';
import { auditService } from './audit.service.js';
import { otpService } from './otp.service.js';

const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

interface OtpSentResult {
  otpSentVia: 'email' | 'sms';
  expiresAt: string;
  expiresInSeconds: number;
}

interface AuthResult {
  token: string;
  refreshToken: string;
  user: PublicUser;
}

async function issue(user: User): Promise<{ token: string; refreshToken: string }> {
  const roleConfig = await roleConfigRepository.findByRole(user.role);
  const token = signAccess({ ...user, role: user.role as Role }, roleConfig?.permissions as PermissionMatrix | undefined);
  const { token: refreshToken, hash } = signRefresh(user.id);
  await refreshTokenRepository.create(user.id, hash, new Date(Date.now() + REFRESH_MS));
  return { token, refreshToken };
}

// Profile orchestration shared by self-registration (patient only) and
// admin-created accounts (any role). auth-service owns credentials/identity;
// core-service owns the Patient/Provider profile — cross-service call, with
// the User row deleted as a compensating action if it fails.
interface ProfileFields {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dob?: string;
  city?: string;
  language?: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  neighborhood?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  familyMembers?: Array<{ fullName: string; relationship: string }>;
  consents?: string[];
  physicianType?: string;
  specialtyIds?: string[];
  encounterPrivileges?: string[];
  languages?: string[];
}

async function attachProfile(role: string, user: User, input: ProfileFields): Promise<User> {
  if (role === 'patient') {
    const patient = await coreClient.patients.create({
      userId: user.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      dob: input.dob,
      idType: input.idType,
      idNumber: input.idNumber,
      language: input.language,
      address: input.address,
      neighborhood: input.neighborhood,
      country: input.country,
      city: input.city,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      emergencyContactRelationship: input.emergencyContactRelationship,
      familyMembers: input.familyMembers,
      consents: input.consents,
    });
    return userRepository.updateLinks(user.id, { patientId: patient.id });
  }
  if (role === 'physician') {
    // Resolve display names for the chosen specialties here (same-service —
    // Category lives in this service) and denormalize onto both this User row
    // and the core-service Provider row, same pattern as Location.officeManagerName.
    const specialtyIds = input.specialtyIds ?? [];
    const categories = specialtyIds.length ? await categoryRepository.findByIds(specialtyIds) : [];
    const specialtyNames = categories.map((c) => c.name);
    await coreClient.providers.create({
      userId: user.id,
      firstName: input.firstName,
      lastName: input.lastName,
      type: input.physicianType,
      specialtyIds,
      specialtyNames,
      city: input.city,
      modes: input.encounterPrivileges,
      languages: input.languages,
      active: true,
    });
    return userRepository.update(user.id, { physicianSpecialtyIds: specialtyIds, physicianSpecialtyNames: specialtyNames });
  }
  return user;
}

export const authService = {
  // Public self-registration — patient only. Staff accounts (the other seven
  // canonical roles, including physician) can only be created by an admin.
  // Account starts pending_verification and issues no tokens — otpVerify()
  // (purpose 'registration') is the only path to an active session.
  async register(input: RegisterInput): Promise<{ userId: string; otpSentVia: 'email' | 'sms' }> {
    const email = input.email.toLowerCase();
    if (await userRepository.findByEmail(email, 'patient')) throw new HttpError(409, 'An account with this email already exists');
    if (input.phone && (await userRepository.findByPhone(input.phone, 'patient'))) {
      throw new HttpError(409, 'An account with this phone number already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    let user = await userRepository.create({
      role: 'patient',
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName ?? '',
      phone: input.phone,
      city: input.city,
      languagePref: input.language === 'en' ? 'en' : 'es',
      status: 'pending_verification',
    });
    try {
      user = await attachProfile('patient', user, { ...input, lastName: input.lastName ?? '' });
    } catch {
      await userRepository.delete(user.id);
      throw new HttpError(502, 'Could not complete registration — please try again');
    }

    // Best-effort: if this email previously booked as a guest and paid, carry
    // its Stripe Customer id forward so past-saved cards stay usable. Never
    // blocks registration — a guest's next booking would just create a new
    // Stripe Customer.
    try {
      const stripeCustomerId = await coreClient.bookings.findGuestStripeCustomer(email);
      if (stripeCustomerId) user = await userRepository.update(user.id, { stripeCustomerId });
    } catch {
      // core-service unreachable or no prior guest customer — not fatal
    }

    try {
      const { channel } = await otpService.generateAndSend(user, 'registration', input.otpChannel);
      return { userId: user.id, otpSentVia: channel };
    } catch (err) {
      await userRepository.delete(user.id);
      if (err instanceof HttpError) throw err;
      throw new HttpError(502, 'Could not send a verification code — please try registering again');
    }
  },

  // Admin-created accounts (super_admin, via superadmin-service) — any of the
  // eight canonical roles. Always active immediately (admin already vouches).
  async adminCreateUser(input: AdminCreateUserInput, actor: Actor): Promise<PublicUser> {
    const passwordHash = await bcrypt.hash(input.password, 10);
    let user = await userRepository.create({
      role: input.role,
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      city: input.city,
      languagePref: input.language === 'en' ? 'en' : 'es',
      status: 'active',
      ...(input.role === 'physician'
        ? { physicianType: input.physicianType, physicianLicenseNo: input.physicianLicenseNo, credentialsVerified: true }
        : {}),
    });
    try {
      user = await attachProfile(input.role, user, input);
    } catch {
      await userRepository.delete(user.id);
      throw new HttpError(502, 'Could not complete user creation — please try again');
    }
    await auditService.record(actor, 'user.create', 'user', user.id, { role: input.role, email: user.email });
    return toPublicUser(user);
  },

  // Role-scoped login blocks cross-portal access. `allowedRoles` scopes a
  // login endpoint to a subset of roles (e.g. the shared /login endpoint
  // excludes patient/super_admin, which have their own dedicated endpoints).
  async login(input: LoginInput, allowedRoles?: Role[]): Promise<AuthResult> {
    if (input.role && allowedRoles && !allowedRoles.includes(input.role)) {
      throw new HttpError(400, `Use the dedicated login endpoint for the ${input.role} role`);
    }
    const user = await userRepository.findByEmail(input.email, input.role ?? allowedRoles);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, 'Invalid credentials');
    }
    if (user.status === 'suspended') throw new HttpError(403, 'Account suspended — contact your administrator');
    if (user.status === 'pending_verification') throw new HttpError(403, 'Please verify your account with the code we sent you before logging in');
    return { ...(await issue(user)), user: toPublicUser(user) };
  },

  async refresh(refreshToken: string): Promise<{ token: string }> {
    let sub: string;
    try { sub = verifyRefresh(refreshToken).sub; }
    catch { throw new HttpError(401, 'Invalid refresh token'); }
    const stored = await refreshTokenRepository.findByHash(hashToken(refreshToken));
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw new HttpError(401, 'Refresh token expired');
    const user = await userRepository.findById(sub);
    if (!user) throw new HttpError(401, 'User not found');
    const roleConfig = await roleConfigRepository.findByRole(user.role);
    return { token: signAccess({ ...user, role: user.role as Role }, roleConfig?.permissions as PermissionMatrix | undefined) };
  },

  async logout(userId: string): Promise<void> {
    await refreshTokenRepository.revokeAllForUser(userId);
  },

  async me(userId: string): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw new HttpError(404, 'User not found');
    return toPublicUser(user);
  },

  async linkProfile(id: string, links: { patientId?: string; locationId?: string }): Promise<PublicUser> {
    return toPublicUser(await userRepository.updateLinks(id, links));
  },

  async listStaff(role: Role, city?: string): Promise<Array<{ id: string; name: string; city: string | null }>> {
    const users = await userRepository.listByRole(role, city);
    return users.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, city: u.city }));
  },

  userCounts(): Promise<Array<{ role: string; status: string; count: number }>> {
    return userRepository.countsByRole();
  },

  // Registration: verifying issues the first session. Password reset: verifying
  // only opens a short window for resetPassword() — no tokens here.
  async otpVerify(email: string, code: string, purpose: OtpPurpose): Promise<AuthResult | { verified: true }> {
    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) throw new HttpError(404, 'User not found');
    await otpService.verify(user, code, purpose);
    if (purpose === 'registration') {
      const activated = await userRepository.findById(user.id);
      return { ...(await issue(activated!)), user: toPublicUser(activated!) };
    }
    return { verified: true };
  },

  async otpResend(email: string, purpose: OtpPurpose): Promise<OtpSentResult> {
    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) throw new HttpError(404, 'User not found');
    const { channel, expiresAt, expiresInSeconds } = await otpService.resend(user, purpose);
    return { otpSentVia: channel, expiresAt: expiresAt.toISOString(), expiresInSeconds };
  },

  // Precursor to forgotPassword — reports which delivery channels exist for
  // this account, masked, so the client can render a "send code via email /
  // sms" choice. No user enumeration: an unknown identifier just returns no
  // options, same as forgotPassword's "resolve quietly" posture.
  async forgotPasswordOptions(identifier: string): Promise<{ options: ContactOption[] }> {
    const user = identifier.includes('@')
      ? await userRepository.findByEmail(identifier.toLowerCase())
      : await userRepository.findByPhone(identifier);
    if (!user) return { options: [] };

    const options: ContactOption[] = [{ channel: 'email', masked: maskEmail(user.email) }];
    if (user.phone) options.push({ channel: 'sms', masked: maskPhone(user.phone) });
    return { options };
  },

  // Confirms whether the code was actually sent (matches otpResend's existing
  // "User not found" posture) rather than a generic message — the caller
  // needs a real send confirmation + expiry to drive the OTP entry screen.
  async forgotPassword(identifier: string, channel?: 'email' | 'sms'): Promise<OtpSentResult> {
    const user = identifier.includes('@')
      ? await userRepository.findByEmail(identifier.toLowerCase())
      : await userRepository.findByPhone(identifier);
    if (!user) throw new HttpError(404, 'No account found for that email or phone number');
    const { channel: otpSentVia, expiresAt, expiresInSeconds } = await otpService.generateAndSend(user, 'password_reset', channel);
    return { otpSentVia, expiresAt: expiresAt.toISOString(), expiresInSeconds };
  },

  async resetPassword(identifier: string, newPassword: string): Promise<void> {
    const user = identifier.includes('@')
      ? await userRepository.findByEmail(identifier.toLowerCase())
      : await userRepository.findByPhone(identifier);
    if (!user || !otpService.isPasswordResetWindowOpen(user)) {
      throw new HttpError(400, 'Verify your identity with a code before resetting your password');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.update(user.id, { passwordHash });
    await otpService.clear(user.id);
    await refreshTokenRepository.revokeAllForUser(user.id);
    await auditService.record({ id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` }, 'user.password_reset', 'user', user.id, {});
  },
};
