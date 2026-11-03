import { 
    asyncHandler,
    ApiResponse,
    ApiError
} from "@foodmesh/utils";

import { 
    recordLocationService 
} from "../services/trackingService.js";


const recordLocation = asyncHandler(async (req, res) => {
    const riderId = req.user?.riderId?.trim();

    if(!riderId){
        throw new ApiError(
            403,
            "Access forbidden: Authenticated rider account required"
        );
    }

    const result = await recordLocationService({
        riderId,
        body: req.body
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            result,
            "Rider location recorded successfully"
        )
    );
});


export {
    recordLocation
};