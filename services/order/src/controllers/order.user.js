import asyncHandler from '../middlewares/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';

import createOrderService from '../services/createOrder.js';


const createOrder = asyncHandler ( async(req, res) => { 
        
    const orderDetails = await createOrderService({
        user: req.user,
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


export {
    createOrder
};