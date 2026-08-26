import { Router } from "express";

import {
    authenticateUser
} from "../middlewares/auth.middleware.js";

import {
    addToCart,
    fetchMyCart
} from '../controllers/cart.controller.js'


const router = Router();


router.use(authenticateUser);


router.post("/add",addToCart);
router.get("/my", fetchMyCart);


export default router;
