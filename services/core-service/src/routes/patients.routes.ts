import { Router } from 'express';
import { ah } from '@ucc/service-kit';
import { authenticate } from '../middlewares/authenticate.js';
import { patientsController } from '../controllers/patients.controller.js';

// All patient-record routes require auth (PHI). Kong verifies at the edge;
// authenticate re-verifies + fills req.user for row-level scoping.
export const patientsRoutes = Router();
patientsRoutes.use(authenticate);
patientsRoutes.get('/', ah(patientsController.search));
patientsRoutes.get('/:id', ah(patientsController.get));
patientsRoutes.patch('/:id', ah(patientsController.update));
patientsRoutes.post('/:id/dependents', ah(patientsController.addDependent));
patientsRoutes.delete('/:id/dependents/:depId', ah(patientsController.removeDependent));
