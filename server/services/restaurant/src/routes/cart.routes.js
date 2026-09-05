import { Router } from "express";

import {
    authenticateUser
} from "@foodmesh/utils";

import {
    addToCart,
    fetchMyCart,
    updateCartItemQuantity,
    clearCart,
    removeCartItem,
    removeRestaurantItems
} from '../controllers/cart.controller.js'


const router = Router();


router.use(authenticateUser);


router.post("/add", addToCart);
router.get("/my", fetchMyCart);
router.put("/update", updateCartItemQuantity);
router.delete("/clear", clearCart);
router.delete("/remove/r/:restaurantId", removeRestaurantItems);
router.delete("/remove/:itemId", removeCartItem);


export default router;
