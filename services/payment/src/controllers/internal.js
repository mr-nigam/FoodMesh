import asyncHandler from '../middlewares/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';

import {
    createPaymentForOrderService
} from '../services/internal.js';

const createPaymentForOrder = asyncHandler( async(req, res) => {

    const payment = await createPaymentForOrderService({
        body: req.body
    });

    console.log("Payment created succesfully");
    
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {payment},
                "Payment created successfully"
            )
        );
});


export {
    createPaymentForOrder
};