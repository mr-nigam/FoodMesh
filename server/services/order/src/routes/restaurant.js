import { Router } from 'express';

import {
    authenticateUser
} from '@foodmesh/utils';

import { 
    fetchOrders,
    fetchOrder,
    updateOrderStatus
} from '../controllers/restaurant.js';


const router = Router();


router.use(authenticateUser);

router.get('/:restaurantId/orders/:orderId', fetchOrder);
router.get('/:restaurantId', fetchOrders);
router.patch("/:orderId", updateOrderStatus);


export default router;