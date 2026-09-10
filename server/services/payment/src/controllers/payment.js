import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import { 
    createPaymentAttemptsService,
    verifyPaymentService
} from '../services/payment.js';


const createPaymentAttempts = asyncHandler( async(req, res) => {
    const payment = await createPaymentAttemptsService({
        userId: req.user.id,
        body: req.body
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { payment },
                "Payment attempt created successfully"
            )
        );
});

const verifyPayment = asyncHandler( async(req, res) => {
    const result = await verifyPaymentService({
        userId: req.user.id,
        body: req.body,
        params: req.params
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result,
                "Your payment was successfully verified and completed"
            )
        );
});


export {
    createPaymentAttempts,
    verifyPayment
};