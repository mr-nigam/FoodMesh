import { Router } from 'express';
import { 
    authenticateUser 
} from '../middlewares/auth.js';

import {
    createPaymentForOrder
} from '../controllers/payment.js';


const router = Router();


router.use(authenticateUser);


router.post('/create', createPaymentForOrder);


export default router;