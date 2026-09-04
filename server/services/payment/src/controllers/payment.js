import asyncHandler from '../middlewares/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';


const createPaymentForOrder = asyncHandler( async(req,res) => {
    const userId = req.user.id;
});


export {
    createPaymentForOrder
};