import { Router } from 'express';

import {
    authenticateUser,
    isRider,
    uploadFile
} from '@foodmesh/utils';

import {
    register,
    fetchProfile,
    updateAvailabilityStatus,
    updateLocation
} from '../controllers/rider.js';

import {
    addVehicle,
    fetchVehicles,
    setPrimaryVehicle
} from '../controllers/vehicle.js';


const router = Router();


router.use(authenticateUser);
router.use(isRider);


// Profile & Registration
router.post("/", uploadFile, register);
router.get("/", fetchProfile);

// Availability & Location Heartbeat
router.patch("/availability-status", updateAvailabilityStatus);
router.patch("/location", updateLocation);

// Vehicles Management
router.post("/vehicles", addVehicle);
router.get("/vehicles", fetchVehicles);
router.patch("/vehicles/:vehicleId/primary", setPrimaryVehicle);


export default router;