import { Router } from 'express';
import { 
    authenticateUser 
} from '@foodmesh/utils';

import {
    createPaymentAttempts,
    verifyPayment
} from '../controllers/payment.js';


const router = Router();


router.use(authenticateUser);


router.post('/create', createPaymentAttempts);
router.post('/verify', verifyPayment);
router.post('/verify/:paymentAttemptId', verifyPayment);


export default router;