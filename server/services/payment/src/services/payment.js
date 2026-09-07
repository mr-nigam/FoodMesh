import {
    ApiError
} from '@foodmesh/utils';

import razorpay from '../config/razorpay.js';

import verifyRazorpaySignature 
from '../config/verifyRazorpay.js';

import {
    CPIPaymentTableRepo,
    fetchPaymentDetailsRepo,
    CPIPaymentAttemptsTableRepo,
    CPIPaymentOutboxsTableRepo
} from '../repositories/payment.js';

import {
    publishEvent,
    KAFKA_TOPICS,
    KAFKA_EVENTS,
    createOrdersEvent
} from "@foodmesh/kafka";


import {
    getOrderForPayment
} from '../clients/order.js';


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

const createRazorpayOrder = async({
    paymentData
})=>{
  
    const razorpayOrder = await razorpay.orders.create({
        amount: paymentData.amount,
        currency: paymentData.currency,
        receipt: paymentData.orderId
    });

    const payment = await CPIPaymentAttemptsTableRepo({
        paymentId: paymentData.id,
        providerName: "razorpay",
        status: "pending",
        amount: paymentData.amount,
        currency: paymentData.currency,
        providerOrderId: razorpayOrder.id
    })

    return payment;
};

const createStripeOrder = async({
    paymentRecord
})=>{
        
};

const createPayment = async({
    userId,
    orderId
}) =>{

    const orderData = await getOrderForPayment({
        userId,
        orderId
    });

    if(!orderData){
        throw new ApiError(
            400,
            "Order not found"
        );
    }

    const amount = orderData.total_amount;
    const currency = orderData.currency?? "INR";

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
            400,
            "failed to create entry in payment table"
        );
    }

    return payment;
};

const ALLOWED_PAYMENT_VENDORS = ["razorpay","stripe"];

const createPaymentAttemptsService = async({
    userId,
    body
}) =>{

    const {
        orderId,
        vendor
    } = body;

    const paymentVendor = vendor?.trim() ??null;

    if(!orderId){
        throw new ApiError(
            400,
            "Please provide order id"
        );
    }

    if(
        !paymentVendor || 
        !ALLOWED_PAYMENT_VENDORS.includes(paymentVendor)
    ){
        throw new ApiError(
            400,
            "Payment vendor is invalid"
        );
    }

    let paymentData = await fetchPaymentDetailsRepo({
        userId,
        orderId 
    });

    if(!paymentData){
        paymentData = await createPayment({
            userId,
            orderId
        });
    }

    if(paymentVendor === "razorpay"){
        const paymentAttempt = await createRazorpayOrder({
            paymentData
        });

        if(!paymentAttempt){
            throw new ApiError(
                500,
                "failed to process payment, please try again"
            );
        }

        return paymentAttempt;
    }
    else if(paymentVendor === "stripe"){

        const paymentAttempt = await createStripeOrder({
            paymentData
        });

        if(!paymentAttempt){
            throw new ApiError(
                500,
                "failed to process payment, please try again"
            );
        }

        return paymentAttempt;
    }
};

const verifyPaymentService = async({
    userId,
    body
}) => {
    const paymentVendor = body?.paymentVendor?.trim() ?? null;

    if(
        !paymentVendor ||
        !ALLOWED_PAYMENT_VENDORS.includes(paymentVendor)
    ){
        throw new ApiError(
            400,
            "Payment vendor is invalid"
        );
    }

    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId
    } = body;

    if(paymentVendor === "razorpay"){
        const isValid = verifyRazorpaySignature({
            orderId : razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature
        });

        if(!isValid){
            throw new ApiError(
                400,
                "payment verification failed"
            );
        }
        // verify payment
        // put event in kafka

    }
    else if(paymentVendor === "stripe"){

    }
};

export {
    createPaymentAttemptsService,
    verifyPaymentService
};