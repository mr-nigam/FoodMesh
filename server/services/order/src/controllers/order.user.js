import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';


import createOrderService from '../services/createOrder.js';

import {
    fetchMyOrdersService
} from '../services/getOrder.js';


const createOrder = asyncHandler ( async (req, res) => { 
        
    const {
        orderDetails,
        orderRestaurants,
        deliveryAddress
    } = await createOrderService({
        userId: req.user.id,
        body: req.body
    });


    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {
                    orderDetails,
                    orderRestaurants,
                    deliveryAddress
                },
                "Order created successfully"
            )
        );
});

const fetchMyOrders = asyncHandler ( async (req, res) => {
    
    const ordersData = await fetchMyOrdersService({
        userId: req.user.id
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {ordersData},
                "Order History fecthed successfully"
            )
        );
});


export {
    createOrder,
    fetchMyOrders
};