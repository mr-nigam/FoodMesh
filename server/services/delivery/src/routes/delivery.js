import { Router } from 'express';
import {
    authenticateUser,
    isRider
} from '@foodmesh/utils';

import {
    acceptOffer,
    rejectOffer,
    getActiveDelivery,
    updateDeliveryStatus
} from '../controllers/delivery.js';


const router = Router();


router.use(authenticateUser);
router.use(isRider);


router.put("/offers/:offerId/accept", acceptOffer);
router.put("/offers/:offerId/reject", rejectOffer);
router.get("/active", getActiveDelivery);
router.patch("/:deliveryId/status", updateDeliveryStatus);


export default router;