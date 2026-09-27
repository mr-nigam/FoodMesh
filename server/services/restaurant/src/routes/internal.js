import { Router } from "express";

import {
    authenticateService
} from "@foodmesh/utils";

import {
    fetchCartItems,
    deleteCartData,
    fetchRestaurantData
} from '../controllers/internal.js';


const router = Router();


router.use(authenticateService);


router.get("/:restaurantId", fetchRestaurantData);

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
