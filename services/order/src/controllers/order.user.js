import asyncHandler from '../middlewares/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';

import createOrderService from '../services/createOrder.js';


const createOrder = asyncHandler ( async(req, res) => { 

    const orderType = req?.body?.orderType?.trim() || "";
    
    let orderDetails;
    
    if(orderType === "checkoutSingle"){
        orderDetails = await createOrderService({
            user: req.user,
            body: req.body
        });
        
    }else if(orderType === "checkoutAll"){
        orderDetails = await createOrderService({
            user: req.user,
            body: req.body
        });
    }

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