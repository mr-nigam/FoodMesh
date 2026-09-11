import { Router } from 'express';
import { 
    authenticateUser 
} from '@foodmesh/utils';

import {
    createPaymentAttempts,
    verifyPayment,
    confirmCod
} from '../controllers/payment.js';


const router = Router();


router.use(authenticateUser);


router.post('/', createPaymentAttempts);
router.post('/cod', confirmCod);
router.post('/verify', verifyPayment);
router.post('/verify/:paymentAttemptId', verifyPayment);


export default router;