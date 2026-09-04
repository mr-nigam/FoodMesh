import { Router } from 'express';

import {
    authenticateUser,
    isSeller,
    requireRestaurant
} from '../middlewares/auth.middleware.js';

import uploadFile from 
'../middlewares/multer.middleware.js';

import {
    addRestaurant,
    fetchMyRestaurant,
    updateRestaurantStatus,
    updateRestaurantDetails,
    getNearbyRestaurants,
    fetchSingleRestaurant
} from '../controllers/restaurant.controller.js';


const router = Router();

// Public routes
router.get("/all-nearby", getNearbyRestaurants);


// Authentication boundary
router.use(authenticateUser);


router.get("/my", isSeller, requireRestaurant, fetchMyRestaurant);
router.get("/:restaurantId", fetchSingleRestaurant);


router.use(isSeller);


router.post("/add", uploadFile, addRestaurant);


router.use(requireRestaurant);


router.patch("/status", updateRestaurantStatus);
router.patch("/edit", updateRestaurantDetails);


export default router;