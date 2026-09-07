import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import { 
    createPaymentAttemptsService
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


export {
    createPaymentAttempts
};