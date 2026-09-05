import { Router } from 'express';

import { 
    authenticateService 
} from '@foodmesh/utils';

import {
    fetchAddress
} from '../controllers/internal.js';


const router = Router();


router.use(authenticateService);

router.get(
    "/users/:userId/addresses/:addressId",
    fetchAddress
);


export default router;