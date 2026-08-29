import { Router } from "express";

import {
    authenticateService
} from "../middlewares/auth.middleware.js";

import {
    fetchCartItems,
} from '../controllers/internal.js';


const router = Router();


router.use(authenticateService);


router.get(
    "/users/:userId/restaurant/:restaurantId",
    fetchCartItems
);

router.get(
    "/users/:userId/",
    fetchCartItems
);


export default router;
