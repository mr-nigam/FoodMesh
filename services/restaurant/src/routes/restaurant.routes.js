import { Router } from 'express';

import {
    authenticateUser,
    isSeller
} from '../middlewares/auth.middleware.js';

import {
    addRestaurant
} from '../controllers/restaurant.controller.js';


const router = Router();


router.use(authenticateUser);
router.use(isSeller);

router.post("/create",addRestaurant);


export default router;