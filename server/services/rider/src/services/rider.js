import {
    ApiError,
    verifyCoordinates
} from '@foodmesh/utils';

import {
    setCache,
    getCache,
    deleteCache,
    setGeoCache,
    deleteGeoCache
} from '@foodmesh/redis';

import {
    publishEvent,
    KAFKA_TOPICS,
    KAFKA_EVENTS,
    createRiderEvent
} from "@foodmesh/kafka";

import {
    validateRegisterRider
} from '../validator/validateRider.js';

import {
    uploadFile
} from '../clients/utils.js';

import {
    registerRepo,
    fetchProfileRepo,
    updateAvailabilityStatusRepo,
    updateLocationRepo
} from '../repositories/rider.js';

import {
    addVehicleRepo
} from '../repositories/vehicle.js';

import {
    emitRealtimeEvent   
} from '../clients/realtime.js';


const ALLOWED_AVAILABILITY_STATUS = [
    'online',
    'offline'
];


const registerService = async ({
    userId,
    req
}) => {

    const {
        valid,
        params,
        errors
    } = validateRegisterRider({
        userId,
        data: req?.body
    });

    if(!valid){
        throw new ApiError(
            400,
            errors
        );
    }

    const pictureUrl = await uploadFile({
        file: req?.file
    });

    params.push(pictureUrl);

    const rider = await registerRepo({
        params
    });

    if(!rider){
        throw new ApiError(
            400,
            "Failed to register rider"
        );
    }

    // Auto-create initial vehicle if provided in registration
    if(req.body?.vehicleType){
        try{
            await addVehicleRepo({
                riderId: rider.id,
                vehicleType: req.body.vehicleType,
                manufacturer: req.body.manufacturer,
                model: req.body.model,
                color: req.body.color,
                registrationNumber: req.body.registrationNumber,
                registrationExpiryDate: req.body.registrationExpiryDate,
                isPrimary: true
            });
        }catch(err){
            console.warn("Could not auto-add vehicle on registration:", err.message);
        }
    }

    const riderCreatedEvent = createRiderEvent({
        eventType: KAFKA_EVENTS.RIDER.CREATED,
        eventData: {
            userId,
            riderId: rider.id,
            email: rider.email
        }
    });

    try{
        await publishEvent({
            topic: KAFKA_TOPICS.RIDER,
            key: rider.id,
            event: riderCreatedEvent
        });

    }catch(kafkaErr){
        console.error(
            "[Kafka] Failed to publish rider.created event:",
            kafkaErr.message
        );
    }

    return rider;
};

const fetchProfileService = async({
    riderId
})=>{

    const cacheKey = `rider:profile:${riderId}`;

    const cachedRider = await getCache({
        key: cacheKey
    });

    if(cachedRider){
        return cachedRider;
    }

    const rider = await fetchProfileRepo({
        riderId
    });

    if(!rider){
        return null;
    }

    const ttl = 900;
    await setCache({
        key: cacheKey,
        value: rider,
        ttl
    });

    return rider;
};

const updateAvailabilityStatusService = async({
    userId,
    riderId,
    rawAvailabilityStatus
})=>{

    const availabilityStatus = String(rawAvailabilityStatus ?? "").trim().toLowerCase();

    if(!ALLOWED_AVAILABILITY_STATUS.includes(availabilityStatus)){
        throw new ApiError(
            400,
            "Please provide a valid status: online or offline"
        );
    }

    const rider = await updateAvailabilityStatusRepo({
        riderId,
        availabilityStatus
    });

    if(!rider){
        throw new ApiError(
            400,
            "Failed to update availability status. Please ensure your profile is active."
        );
    }
    
    const cacheKey = `riders:active`;

    if(availabilityStatus === "online" && rider.longitude && rider.latitude){
        const memberValue = `${userId}:${riderId}`;

        await setGeoCache({
            key: cacheKey,
            longitude: rider.longitude,
            latitude: rider.latitude,
            memberValue,
        });
    }else{
        await deleteGeoCache({
            key: cacheKey,
            memberValue: riderId
        });
    }

    await deleteCache({ 
        key: `rider:profile:id:${riderId}` 
    });

    emitRealtimeEvent({
        event: "rider:update:availability-status",
        room: `user:${userId}`,
        payload: {
            riderId,
            userId,
            availabilityStatus
        }
    });

    return rider;
};

const updateLocationService = async({
    userId,
    riderId,
    longitude,
    latitude
})=>{

    if(!riderId){
        throw new ApiError(
            400,
            "Rider id is required for location update"
        );
    }

    const numLon = Number(longitude);
    const numLat = Number(latitude);

    if(
        !verifyCoordinates({ 
            longitude: numLon,
            latitude: numLat 
        }
    )){
        throw new ApiError(
            400,
            "Valid coordinates (longitude, latitude) are required"
        );
    }

    const rider = await updateLocationRepo({
        riderId,
        longitude: numLon,
        latitude: numLat
    });

    if(!rider){
        throw new ApiError(
            404,
            "Rider profile not found"
        );
    }

    if(rider.availability_status === "online"){
        const memberValue = `${userId}:${riderId}`;
        await setGeoCache({
            key: `riders:active`,
            longitude: numLon,
            latitude: numLat,
            memberValue,
        });
    }

    return rider;
};


export {
    registerService,
    fetchProfileService,
    updateAvailabilityStatusService,
    updateLocationService
};