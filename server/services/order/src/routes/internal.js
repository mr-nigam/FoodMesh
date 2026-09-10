import { Router } from 'express';
import { fetchOrder } from '../controllers/internal.js';

const router = Router();

router.get('/orders/:orderId/users/:userId', fetchOrder);

export default router;
