import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import{
    fetchOrdersService,
    fetchOrderService,
    updateRestaurantOrderStatusService
} from '../services/restaurant.js';


const fetchOrders = asyncHandler( async(req, res)=>{
    const orders = await fetchOrdersService({
       req
    });
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {orders},
                "All orders fetched successfully"
            )
        );
});

const fetchOrder = asyncHandler( async(req, res)=>{
    const order = await fetchOrderService({
        req
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {order},
                "Order details fetched successfully"
            )
        );
});

const updateRestaurantOrderStatus = asyncHandler( async(req, res)=>{

    const order = await updateRestaurantOrderStatusService({
        req
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {order},
                "Order status updated successfully"
            )
        );
});


export {
    fetchOrders,
    fetchOrder,
    updateRestaurantOrderStatus
};