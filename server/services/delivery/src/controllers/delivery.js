import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import {
    acceptOfferService,
    rejectOfferService,
    getActiveDeliveryService,
    updateDeliveryStatusService
} from '../services/deliveryActionService.js';


const acceptOffer = asyncHandler(async (req, res) => {

    const delivery = await acceptOfferService({
        req
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {delivery},
                "Delivery offer accepted successfully"
            )
        );
});

const rejectOffer = asyncHandler(async (req, res) => {
    
    const offer = await rejectOfferService({
        offerId: req.params?.offerId,
        riderId: req?.user?.riderId ?? null
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { offer },
                "Delivery offer rejected"
            )
        );
});

const getActiveDelivery = asyncHandler(async (req, res) => {

    const delivery = await getActiveDeliveryService({
        riderId: req.user?.riderId?.trim()
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { delivery },
                "Active delivery fetched successfully"
            )
        );
});

const updateDeliveryStatus = asyncHandler(async (req, res) => {
    
    const delivery = await updateDeliveryStatusService({
        req
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { delivery },
                "Delivery status updated successfully"
            )
        );
});


export {
    acceptOffer,
    rejectOffer,
    getActiveDelivery,
    updateDeliveryStatus
};