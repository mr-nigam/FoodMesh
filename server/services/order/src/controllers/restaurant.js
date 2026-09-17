import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import{
    fetchOrdersService,
    fetchOrderService,
    updateOrderStatusService
} from '../services/restaurant.js';


const fetchOrders = asyncHandler( async(req, res)=>{
    const orders = await fetchOrdersService({
       req
    });
    
    console.log("orders: ",orders);
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

    console.log("order: ",order);

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

const updateOrderStatus = asyncHandler( async(req, res)=>{

    const order = await updateOrderStatusService({
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
    updateOrderStatus
};