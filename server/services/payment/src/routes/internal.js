import { Router } from 'express';
import { 
    authenticateService 
} from '../middlewares/auth.js';

import {
    createPaymentForOrder
} from '../controllers/internal.js';


const router = Router();


router.use(authenticateService);


router.post('/create', createPaymentForOrder);


export default router;