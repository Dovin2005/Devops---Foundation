import type { Request, Response } from 'express';
import { ok } from '@ucc/service-kit';
import type { SendOtpInput } from '@ucc/types';
import { otpService } from '../services/otp.service.js';

export const otpController = {
  async send(req: Request, res: Response) {
    ok(res, await otpService.send(req.body as SendOtpInput));
  },
};
