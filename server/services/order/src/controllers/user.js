import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import createOrderService from '../services/createOrder.js';

import {
    fetchOrdersService
} from '../services/user.js';


const createOrder = asyncHandler ( async (req, res) => { 
        
    const orderDetails = await createOrderService({
        userId: req.user.id,
        body: req.body
    });


    console.log(orderDetails);

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {
                    orderDetails
                },
                "Order created successfully"
            )
        );
});

const fetchOrder = asyncHandler ( async (req, res) => {
    
    const order = await fetchOrdersService({
        userId: req.user.id,
        orderId: req.params?.orderId ||  req.params?.id
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {order},
                "Order Detailes fecthed successfully"
            )
        );
});

const fetchOrders = asyncHandler ( async (req, res) => {
    
    const orders = await fetchOrdersService({
        userId: req.user.id
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {orders},
                "Order History fecthed successfully"
            )
        );
});


export {
    createOrder,
    fetchOrder,
    fetchOrders
};