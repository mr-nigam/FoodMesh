import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import { 
    createPaymentForOrderService
} from '../services/internal.js';


const createPaymentForOrder = asyncHandler( async(req, res) => {
    const userId = req.user.id;

    const payment = await createPaymentForOrderService({
        body: {
            ...req.body,
            userId
        }
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { payment },
                "Payment created successfully"
            )
        );
});


export {
    createPaymentForOrder
};