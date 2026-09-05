import { Router } from 'express';

import {
    authenticateUser,
    isSeller
} from '@foodmesh/utils';

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


router.use(authenticateUser);


router.get("/my", isSeller, fetchMyRestaurant);
router.get("/:restaurantId", fetchSingleRestaurant);


router.use(isSeller);


router.post("/add", uploadFile, addRestaurant);


router.patch("/status", updateRestaurantStatus);
router.patch("/edit", updateRestaurantDetails);


export default router;