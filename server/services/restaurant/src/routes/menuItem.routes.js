import { Router } from "express";

import {
    authenticateUser,
    isSeller,
    uploadFile
} from "@foodmesh/utils";

import {
    addMenuItem,
    fetchAllItems,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability
} from "../controllers/menuItem.controller.js";


const router = Router();

/*
 * Public route
 */

router.get(
    "/all/:restaurantId",
    fetchAllItems
);

/*
 * Seller protected routes
 */

router.use(authenticateUser);
router.use(isSeller);


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
    toggleItemAvailability
);

router.delete(
    "/:itemId",
    deleteMenuItem
);


export default router;