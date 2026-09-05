import { Router } from 'express';

import { 
    authenticateUser
} from '@foodmesh/utils';

import {
    loginUser,
    myProfile,
    Home,
    updateRole
} from '../controllers/auth.js'


const router = Router();


router.post("/login", loginUser);


router.use(authenticateUser);

//router.post("/",Home);
router.get("/me", myProfile);
router.put("/set-role", updateRole);


export default router;