import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import {
    registerService,
    fetchProfileService,
    updateAvailabilityStatusService,
    updateLocationService
} from '../services/rider.js';


const register = asyncHandler( async(req, res)=>{
    
    const rider = await registerService({
        userId: req.user?.id,
        req
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {rider},
                "Rider registered successfully"
            )
        );
});

const fetchProfile = asyncHandler(async(req, res)=>{
    
    const profile = await fetchProfileService({
        riderId: req.user?.riderId?.trim()
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {profile},
                "My profile data is fetched successfully"
            )
        );
});

const updateAvailabilityStatus = asyncHandler(async(req, res)=>{

    const rider = await updateAvailabilityStatusService({
        userId: req.user.id,
        riderId: req.user?.riderId?.trim(),
        rawAvailabilityStatus: req.body?.availabilityStatus ?? req.query?.availabilityStatus
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {rider},
                "Availability status updated successfully"
            )
        );
});

const updateLocation = asyncHandler(async(req, res)=>{

    const rider = await updateLocationService({
        userId: req.user.id,
        riderId: req?.user?.riderId?.trim() ?? null,
        longitude: req.body?.longitude,
        latitude: req.body?.latitude
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {rider},
                "Location updated successfully"
            )
        );
});


export {
    register,
    fetchProfile,
    updateAvailabilityStatus,
    updateLocation
};