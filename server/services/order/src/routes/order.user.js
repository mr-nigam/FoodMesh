import { Router } from 'express';

import {
    authenticateUser
} from '@foodmesh/utils';

import { 
    createOrder,
    fetchOrder,
    fetchOrders
} from '../controllers/user.js';

const router = Router();


router.use(authenticateUser);


router.post('/', createOrder);
router.get("/", fetchOrders);
router.get("/:orderId", fetchOrder);

export default router;