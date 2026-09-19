import { Router } from "express";

import {
    authenticateUser
} from "@foodmesh/utils";

import {
    loginUser,
    myProfile,
    Home,
    updateRole
} from "../controllers/auth.js";


const router = Router();


router.post("/login", loginUser);


/*
 * Everything below this line requires authentication.
 */

router.use(authenticateUser);


router.get("/me", myProfile);

router.put("/set-role", updateRole);


export default router;