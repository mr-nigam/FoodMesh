import { Router } from 'express';

import {
    authenticateUser,
    isSeller
} from '../middlewares/auth.middleware.js';

import uploadFile from 
'../middlewares/multer.middleware.js';

import {
    addRestaurant,
    fetchMyRestaurant
} from '../controllers/restaurant.controller.js';


const router = Router();


router.use(authenticateUser);
router.use(isSeller);

router.post("/add",uploadFile,addRestaurant);
router.get("/my",fetchMyRestaurant);


export default router;