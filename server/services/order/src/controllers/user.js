import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import createOrderService from '../services/createOrder.js';

import {
    fetchOrdersService,
    fetchOrderService,
    cancelOrderService
} from '../services/user.js';


const createOrder = asyncHandler ( async (req, res) => { 

    const orderDetails = await createOrderService({
        userId: req.user.id,
        body: req.body
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { orderDetails },
                "Order created successfully"
            )
        );
});

const fetchOrders = asyncHandler ( async (req, res) => {
    const orders = await fetchOrdersService({
        userId: req.user.id,
        query: req.query
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {orders},
                "Order History fetched successfully"
            )
        );
});

const fetchOrder = asyncHandler ( async (req, res) => {
    
    const order = await fetchOrderService({
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

const cancelOrder = asyncHandler(async (req, res)=>{
    
    const order = await cancelOrderService({
        userId: req.user.id,
        orderId: req.params?.id ?? req.params?.orderId
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {order},
                "Order cancelled successfully"
            )
        );
});


export {
    createOrder,
    fetchOrder,
    fetchOrders,
    cancelOrder
};