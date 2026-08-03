import { Router } from 'express';
import { ah } from '@ucc/service-kit';
import { authenticate } from '../middlewares/authenticate.js';
import { casesController } from '../controllers/cases.controller.js';

// Cases are PHI → authenticated + row-scoped by role.
export const casesRoutes = Router();
casesRoutes.get('/cases', authenticate, ah(casesController.list));
casesRoutes.get('/cases/:id', authenticate, ah(casesController.detail));
// Provider availability is public (booking step 3, no PHI).
casesRoutes.get('/providers/:id/availability', ah(casesController.availability));
