import { 
    ApiError,
    verifyCoordinates
} from '@foodmesh/utils';

import {
    findNearbyRidersRepo,
    fetchRidersByIdsRepo
} from '../repositories/internal.js';


const findNearbyRidersService = async ({
    longitude,
    latitude,
    radiusMeters = 5000,
    limit = 30
}) => {

    if(!verifyCoordinates({
            longitude: Number(longitude),
            latitude: Number(latitude)
        })
    ){
        throw new ApiError(
            400,
            "Longitude and latitude are required"
        );
    }

    const riders = await findNearbyRidersRepo({
        longitude: Number(longitude),
        latitude: Number(latitude),
        radiusMeters: Number(radiusMeters),
        limit: Number(limit)
    });

    return riders;
};

const fetchRidersByIdsService = async ({
    riderIds
}) => {
    if (!Array.isArray(riderIds) || riderIds.length === 0) {
        return [];
    }

    const riders = await fetchRidersByIdsRepo({
        riderIds
    });

    return riders;
};


export {
    findNearbyRidersService,
    fetchRidersByIdsService
};
