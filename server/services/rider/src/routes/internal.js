import { Router } from 'express';
import { 
    authenticateService
} from '@foodmesh/utils';
import {
    fetchNearbyRiders,
    fetchRidersByIds
} from '../controllers/internal.js';


const router = Router();


router.use(authenticateService);


router.get("/delivery/nearby", fetchNearbyRiders);
router.post("/batch", fetchRidersByIds);


export default router;
