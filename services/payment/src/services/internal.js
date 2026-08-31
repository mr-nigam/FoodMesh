import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';


import {
    CPIPaymentTableRepo,
    CPIPaymentAttemptsTableRepo,
    CPIPaymentOutboxsTableRepo
} from '../repositories/internal.js';


const paymentDataValidator = ({
    userId,
    orderId,
    amount,
    currency
}) =>{

    if(!userId || !orderId){
        throw new ApiError(
            400,
            "Please provide user and order id"
        );
    }

    const amt = Number(amount || amount || 0);

    if(!Number.isFinite(amt) || amt < 0){
        throw new ApiError(
            400,
            "Invalid amount"
        );
    }

    if(!currency || !currency?.trim()){
        throw new ApiError(
            400,
            "provide currency detailes"
        );
    }

    // const pMethod =
    //     typeof paymentMethod === "string"
    //         ? paymentMethod.trim().toLowerCase()
    //         : null;

    // const validPaymentMethods = [
    //     "razorpay",
    //     "stripe"
    // ];

    // // yup done it baby
    // if(!validPaymentMethods.includes(pMethod)){
    //     throw new ApiError(
    //         400,
    //         "Invalid payment method"
    //     );
    // }

    return { amt };
};

const createPaymentForOrderService = async({
    body
}) =>{

    const {
        userId,
        orderId,
        amount,
        currency
    } = body;

    const {
        amt
    } = paymentDataValidator({
        userId,
        orderId,
        amount,
        currency
    });

    //CPI = createPaymentIn
    const payment = await CPIPaymentTableRepo({
        userId,
        orderId,
        amount: amt,
        currency
    });
    
    if(!payment){
        throw new ApiError(
            500,
            "Failed to create payment for this order"
        );
    }

    return payment;
};


export {
    createPaymentForOrderService
};