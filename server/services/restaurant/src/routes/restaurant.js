import { Router } from 'express';

import {
    authenticateUser,
    isSeller,
    uploadFile
} from '@foodmesh/utils';

import {
    register,
    fetchMyRestaurant,
    updateRestaurantStatus,
    updateRestaurantDetails,
    getNearbyRestaurants,
    fetchSingleRestaurant
} from '../controllers/restaurant.js';


const router = Router();

// Public routes
router.get("/all-nearby", getNearbyRestaurants);


router.use(authenticateUser);


router.get("/my", isSeller, fetchMyRestaurant);
router.get("/:restaurantId", fetchSingleRestaurant);


router.use(isSeller);


router.post("/add", uploadFile, register);


router.patch("/status", updateRestaurantStatus);
router.patch("/edit", updateRestaurantDetails);


export default router;