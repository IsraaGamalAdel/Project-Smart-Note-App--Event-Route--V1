import { Router } from "express" ;

import * as registrationService from './service/registration.service.js';

const router = Router();

router.post('/signup', registrationService.signup);

export default router;



