import { Router } from 'express';
import { ah, requireInternalSecret } from '@ucc/service-kit';
import { sendOtpSchema } from '@ucc/types';
import { otpController } from '../controllers/otp.controller.js';
import { validate } from '../middlewares/validate.js';
import { env } from '../config/env.js';

export const otpRoutes = Router();

// Service-to-service only — called by auth-service, never a browser.
otpRoutes.use(requireInternalSecret(env.internalSecret));
otpRoutes.post('/', validate(sendOtpSchema), ah(otpController.send));
