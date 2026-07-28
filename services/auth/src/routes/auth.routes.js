import { Router } from 'express';

import {
    loginUser,
    myProfile,
    Home,
    updateRole
} from '../controllers/auth.controller.js'


const router = Router();


//router.post("/",Home);
router.post("/login",loginUser);
router.get("/me" ,myProfile);
router.get("/select-role" ,updateRole);


export default router;