import { Router } from "express";

import {
    authenticateUser
} from "../middlewares/auth.middleware.js";

import {
    addToCart,
    fecthMyCart
} from '../controllers/cart.controller.js'


const router = Router();


router.use(authenticateUser);


router.post("/add",addToCart);
router.get("/my",fecthMyCart);


export default router;
