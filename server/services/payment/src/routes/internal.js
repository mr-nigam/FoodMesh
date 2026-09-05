import { Router } from 'express';
import { 
    authenticateService 
} from '@foodmesh/utils';

import {
    createPaymentForOrder
} from '../controllers/internal.js';


const router = Router();


router.use(authenticateService);


router.post('/create', createPaymentForOrder);


export default router;