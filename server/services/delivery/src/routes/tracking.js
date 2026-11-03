import { Router } from "express";
import { authenticateUser, isRider } from "@foodmesh/utils";
import { recordLocation } from "../controllers/tracking.js";
import { trackingRateLimiter } from "../middlewares/trackingRateLimiter.js";

const router = Router();

router.use(authenticateUser);
router.use(isRider);
router.use(trackingRateLimiter);

router.post("/location", recordLocation);

export default router;
