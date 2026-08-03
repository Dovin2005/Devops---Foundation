import type { Request, Response } from 'express';
import { HttpError, ok, okList, created } from '@ucc/service-kit';
import { SHARED_LOGIN_ROLES, type CredentialsLoginInput } from '@ucc/types';
import { authService } from '../services/auth.service.js';

// Controllers are thin: parse request → call service → shape response.
export const authController = {
  async register(req: Request, res: Response) {
    created(res, await authService.register(req.body), 'Registered successfully, verification code sent');
  },

  // Shared staff login — physician, coordinator, office_manager, marketing,
  // fulfillment, nurse. Patient and super_admin use their own endpoints below.
  async login(req: Request, res: Response) {
    ok(res, await authService.login(req.body, SHARED_LOGIN_ROLES));
  },

  async loginPatient(req: Request, res: Response) {
    const { email, password } = req.body as CredentialsLoginInput;
    ok(res, await authService.login({ email, password, role: 'patient' }, ['patient']));
  },

  async loginSuperAdmin(req: Request, res: Response) {
    const { email, password } = req.body as CredentialsLoginInput;
    ok(res, await authService.login({ email, password, role: 'super_admin' }, ['super_admin']));
  },

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) throw new HttpError(400, 'refreshToken required');
    ok(res, await authService.refresh(refreshToken));
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.user!.sub);
    ok(res, null, 'Logged out');
  },

  async me(req: Request, res: Response) {
    ok(res, await authService.me(req.user!.sub));
  },

  async linkProfile(req: Request, res: Response) {
    ok(res, await authService.linkProfile(req.params.id!, req.body));
  },

  async listStaff(req: Request, res: Response) {
    const role = String(req.query.role ?? 'coordinator') as Parameters<typeof authService.listStaff>[0];
    const city = req.query.city ? String(req.query.city) : undefined;
    okList(res, await authService.listStaff(role, city));
  },

  async userCounts(_req: Request, res: Response) {
    ok(res, await authService.userCounts());
  },

  async otpVerify(req: Request, res: Response) {
    const { email, code, purpose } = req.body as { email: string; code: string; purpose: 'registration' | 'password_reset' };
    ok(res, await authService.otpVerify(email, code, purpose));
  },

  async otpResend(req: Request, res: Response) {
    const { email, purpose } = req.body as { email: string; purpose: 'registration' | 'password_reset' };
    ok(res, await authService.otpResend(email, purpose));
  },

  async forgotPasswordOptions(req: Request, res: Response) {
    const { identifier } = req.body as { identifier: string };
    ok(res, await authService.forgotPasswordOptions(identifier));
  },

  async forgotPassword(req: Request, res: Response) {
    const { identifier, channel } = req.body as { identifier: string; channel?: 'email' | 'sms' };
    ok(res, await authService.forgotPassword(identifier, channel));
  },

  async resetPassword(req: Request, res: Response) {
    const { identifier, newPassword } = req.body as { identifier: string; newPassword: string };
    await authService.resetPassword(identifier, newPassword);
    ok(res, null, 'Password reset successful');
  },
};
