import { Router } from 'express';
import { ah } from '@ucc/service-kit';
import { providersController } from '../controllers/providers.controller.js';

// Public directory (Find a Doctor + booking steps 2–3). No auth — no PHI here.
// The availability grid lives in cases.routes.ts (GET /providers/:id/availability).
export const providersRoutes = Router();
providersRoutes.get('/providers', ah(providersController.list));
