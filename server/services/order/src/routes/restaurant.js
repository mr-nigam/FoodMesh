import { Router } from 'express';

import {
    authenticateUser
} from '@foodmesh/utils';

import { 
    fetchOrders,
    fetchOrder,
    updateRestaurantOrderStatus
} from '../controllers/restaurant.js';


const router = Router();


router.use(authenticateUser);


router.get('/', fetchOrders);
router.get('/:orderId', fetchOrder);
router.patch("/:orderId", updateRestaurantOrderStatus);


export default router;