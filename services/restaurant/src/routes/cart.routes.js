import { Router } from "express";

import {
    authenticateUser
} from "../middlewares/auth.middleware.js";

import {
    addToCart,
    fetchMyCart,
    updateCartItemQuantity,
    clearCart
} from '../controllers/cart.controller.js'


const router = Router();


router.use(authenticateUser);


router.post("/add", addToCart);
router.get("/my", fetchMyCart);
router.put("/update", updateCartItemQuantity);
router.delete("/clear", clearCart);


export default router;
