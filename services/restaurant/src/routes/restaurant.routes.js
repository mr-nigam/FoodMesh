import { Router } from 'express';

import {
    authenticateUser,
    isSeller
} from '../middlewares/auth.middleware.js';

import uploadFile from 
'../middlewares/multer.middleware.js';

import {
    addRestaurant,
    fetchMyRestaurant,
    updateRestaurantStatus,
    updateRestaurantDetails
} from '../controllers/restaurant.controller.js';


const router = Router();


router.use(authenticateUser);
router.use(isSeller);

router.post("/add", uploadFile, addRestaurant);
router.get("/my", fetchMyRestaurant);
router.patch("/status", updateRestaurantStatus);
router.patch("/edit", updateRestaurantDetails);


export default router;