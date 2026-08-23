import { Router } from "express";

import uploadFile from 
'../middlewares/multer.middleware.js';

import {
    authenticateUser,
    isSeller,
    requireRestaurant
} from '../middlewares/auth.middleware.js';

import {
    addMenuItem,
    fetchAllItems,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailbility
} from '../controllers/menuItems.controller.js';


const router = Router();


// public
router.get(
    "/all/:restaurantId",
    fetchAllItems
);


// Seller protected routes
router.use(authenticateUser);
router.use(isSeller);
router.use(requireRestaurant);


router.post(
    "/add-item",
    uploadFile,
    addMenuItem
);

router.put(
    "/:itemId",
    updateMenuItem
);

router.patch(
    "/:itemId/availability",
    toggleItemAvailbility
);

router.delete(
    "/:itemId",
    deleteMenuItem
);


export default router;