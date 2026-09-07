import{
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import {
    fetchOrderForPaymentService
} from '../services/internal.js';

const fetchOrder = asyncHandler( async(req,res) =>{
    
    const orderDetails = await fetchOrderForPaymentService({
        userId: req.params?.userId,
        orderId: req.params?.orderId
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {orderDetails},
                "Order data fatched successfully"
            )
        );
});


export {
    fetchOrder
};