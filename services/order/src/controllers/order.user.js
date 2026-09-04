import asyncHandler from '../middlewares/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import createOrderService from '../services/createOrder.js';


import {
    fetchMyOrdersService
} from '../services/getOrder.js';


const createOrder = asyncHandler ( async(req, res) => { 
        
    const {
        orderDetails,
        orderRestaurants,
        deliveryAddress,
        payment
    } = await createOrderService({
        user: req.user,
        body: req.body
    });

    let message = "Order created successfully";

    if(payment){
        message += " and payment is also created successfully";
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {
                    orderDetails,
                    orderRestaurants,
                    deliveryAddress,
                    payment
                },
                message
            )
        );
});

const fetchMyOrders = asyncHandler ( async(req, res) => {
    
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