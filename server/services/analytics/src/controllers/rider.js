import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import {
    fetchRiderMetricsService
} from '../services/rider.js';


const fetchRiderMetrics = asyncHandler(async(req, res)=>{

    const metrics = await fetchRiderMetricsService({
        riderId : req.user?.riderId
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { metrics },
                "Rider performance metrics fetched successfully"
            )
        );
});


export {
    fetchRiderMetrics
};
