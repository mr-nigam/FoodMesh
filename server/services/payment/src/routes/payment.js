import { Router } from 'express';
import { 
    authenticateUser 
} from '@foodmesh/utils';

import {
    createPaymentAttemptsForOrder
} from '../controllers/payment.js';


const router = Router();


router.use(authenticateUser);


router.post('/create', createPaymentAttemptsForOrder);


export default router;