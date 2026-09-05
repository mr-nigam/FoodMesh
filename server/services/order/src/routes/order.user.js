import { Router } from 'express';

import {
    authenticateUser
} from '@foodmesh/utils';

import { 
    createOrder
} from '../controllers/order.user.js';

const router = Router();

router.use(authenticateUser);

router.post('/create', createOrder);


export default router;