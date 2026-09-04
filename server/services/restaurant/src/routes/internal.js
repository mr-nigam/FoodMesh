import { Router } from "express";

import {
    authenticateService
} from "../middlewares/auth.middleware.js";

import {
    fetchCartItems,
    deleteCartData
} from '../controllers/internal.js';


const router = Router();


router.use(authenticateService);


router.get(
    "/users/:userId/:requestType/restaurant/:restaurantId",
    fetchCartItems
);

router.get(
    "/users/:userId/:requestType",
    fetchCartItems
);

router.delete(
    "/users/:userId/:requestType/restaurant/:restaurantId",
    deleteCartData
);

router.delete(
    "/users/:userId/:requestType",
    deleteCartData
);


export default router;
