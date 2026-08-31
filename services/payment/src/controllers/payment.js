import asyncHandler from '../middlewares/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';


const createPaymentForOrder = asyncHandler( async(req,res) => {
    const user = req.user;

    
});

const fetchOrderForPayment = asyncHandler( async(req,res)=>{

});

export {
    createPaymentForOrder,
    fetchOrderForPayment
};