import{
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import {
    fetchOrderService,
    fetchRestaurantOrderService
} from '../services/internal.js';


const fetchOrder = asyncHandler( async(req,res) =>{
    
    const order = await fetchOrderService({
        userId: req.params?.userId,
        orderId: req.params?.orderId
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { order },
                "Order data fatched successfully"
            )
        );
});

const fetchRestaurantOrder = asyncHandler(async(req, res)=>{

    const order = await fetchRestaurantOrderService({
        params: {
            ...req.params,
            ...req.query
        }
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {order},
                "Fetched restaurant order successfully"
            )
        );
});


export {
    fetchOrder,
    fetchRestaurantOrder
};