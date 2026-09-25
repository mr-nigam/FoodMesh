import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import {
    findNearbyRidersService,
    fetchRidersByIdsService
} from '../services/internal.js';


const fetchNearbyRiders = asyncHandler(async (req, res) => {
    const {
        longitude,
        latitude,
        radius,
        limit
    } = req.query;

    const riders = await findNearbyRidersService({
        longitude: Number(longitude),
        latitude: Number(latitude),
        radiusMeters: Number(radius),
        limit: Number(limit)
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { riders },
                "Fetched nearby riders successfully"
            )
        );
});

const fetchRidersByIds = asyncHandler(async (req, res) => {
    const riderIds = req.body?.riderIds || req.query?.riderIds?.split(",");

    const riders = await fetchRidersByIdsService({
        riderIds
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { riders },
                "Fetched riders by IDs successfully"
            )
        );
});


export {
    fetchNearbyRiders,
    fetchRidersByIds
};
