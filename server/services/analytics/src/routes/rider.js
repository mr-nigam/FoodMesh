import { Router } from 'express';

import {
    authenticateUser,
} from '@foodmesh/utils';

import {
    fetchRiderMetrics
} from '../controllers/rider.js';


const router = Router();


router.use(authenticateUser);


router.get("/metrics", fetchRiderMetrics);


export default router;
