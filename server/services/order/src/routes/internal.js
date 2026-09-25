import { Router } from 'express';
import { 
    fetchOrder,
    fetchRestaurantOrder
} from '../controllers/internal.js';

import{
    authenticateService
} from '@foodmesh/utils';

const router = Router();


router.use(authenticateService);


router.get('/orders/:orderId/users/:userId', fetchOrder);
router.get('/delivery/:orderRestaurantId', fetchRestaurantOrder);


export default router;
