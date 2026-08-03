import { Router } from 'express';
import { ah } from '@ucc/service-kit';
import { registerSchema, loginSchema, credentialsLoginSchema, otpVerifySchema, otpResendSchema, forgotPasswordOptionsSchema, forgotPasswordSchema, resetPasswordSchema } from '@ucc/types';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { otpRateLimiter } from '../middlewares/rateLimit.js';

export const authRoutes = Router();

authRoutes.post('/register', otpRateLimiter(), validate(registerSchema), ah(authController.register));
// Shared staff login (physician, coordinator, office_manager, marketing, fulfillment, nurse).
authRoutes.post('/login', validate(loginSchema), ah(authController.login));
// Dedicated logins — patient and super_admin each get their own endpoint instead of the `role` field.
authRoutes.post('/login/patient', validate(credentialsLoginSchema), ah(authController.loginPatient));
authRoutes.post('/login/superadmin', validate(credentialsLoginSchema), ah(authController.loginSuperAdmin));
authRoutes.post('/refresh', ah(authController.refresh));
authRoutes.post('/logout', authenticate, ah(authController.logout));
authRoutes.get('/me', authenticate, ah(authController.me));
authRoutes.patch('/internal/users/:id/links', ah(authController.linkProfile));
authRoutes.get('/internal/staff', ah(authController.listStaff));
authRoutes.get('/internal/users/counts', ah(authController.userCounts));
authRoutes.post('/otp/verify', otpRateLimiter(), validate(otpVerifySchema), ah(authController.otpVerify));
authRoutes.post('/otp/resend', otpRateLimiter(), validate(otpResendSchema), ah(authController.otpResend));
authRoutes.post('/forgot-password/options', otpRateLimiter(), validate(forgotPasswordOptionsSchema), ah(authController.forgotPasswordOptions));
authRoutes.post('/forgot-password', otpRateLimiter(), validate(forgotPasswordSchema), ah(authController.forgotPassword));
authRoutes.post('/reset-password', otpRateLimiter(), validate(resetPasswordSchema), ah(authController.resetPassword));
