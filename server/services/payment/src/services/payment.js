import { ApiError } from '@foodmesh/utils';
import razorpay from '../config/razorpay.js';
import stripe from '../config/stripe.js';
import verifyRazorpaySignature from '../config/verifyRazorpay.js';

import {
    CPIPaymentTableRepo,
    fetchPaymentDetailsRepo,
    fetchPaymentByIdRepo,
    updatePaymentStatusRepo,
    CPIPaymentAttemptsTableRepo,
    fetchPaymentAttemptByIdRepo,
    updatePaymentAttemptRepo,
    CPIPaymentOutboxsTableRepo
} from '../repositories/payment.js';

import {
    publishEvent,
    KAFKA_TOPICS,
    KAFKA_EVENTS,
    createPaymentEvent
} from "@foodmesh/kafka";

import { 
    getOrderForPayment
} from '../clients/order.js';


const ALLOWED_PAYMENT_VENDORS = ["razorpay", "stripe"];

const paymentDataValidator = ({
    userId,
    orderId,
    amount,
    currency
}) => {
    if (!userId || !orderId) {
        throw new ApiError(400, "Please provide user and order ID");
    }

    const amt = Number(amount || 0);
    if (!Number.isFinite(amt) || amt < 0) {
        throw new ApiError(400, "Invalid amount");
    }

    if (!currency || !currency?.trim()) {
        throw new ApiError(400, "Provide currency details");
    }

    return { amt };
};

const createRazorpayOrder = async ({ 
    paymentData 
}) => {

    try{
        const amountInSubunits = Math.round(Number(paymentData.amount));

        const razorpayOrder = await razorpay.orders.create({
            amount: amountInSubunits,
            currency: paymentData.currency || "INR",
            receipt: `rcpt_${String(paymentData.order_id).replace(/-/g, '').slice(0, 20)}`
        });

        const paymentAttempt = await CPIPaymentAttemptsTableRepo({
            paymentId: paymentData.id,
            providerName: "razorpay",
            status: "pending",
            amount: paymentData.amount,
            currency: paymentData.currency,
            providerOrderId: razorpayOrder.id
        });

        return {
            paymentAttemptId: paymentAttempt.id,
            orderId: paymentData.order_id,
            amount: paymentData.amount,
            currency: paymentData.currency,
            provider: "razorpay",
            providerOrderId: razorpayOrder.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_API_KEY
        };

    }catch(error){

        console.error("Razorpay Order Creation Error:", error);
        
        throw new ApiError(
            error.statusCode || 400,
            `Razorpay Error: ${error.error?.description || error.message || "Failed to create Razorpay order"}`
        );
    }
};

const createStripeOrder = async ({ 
    paymentData,
    userId 
}) => {

    try{
        const amountInSubunits = Math.round(Number(paymentData.amount));

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInSubunits,
            currency: (paymentData.currency || "inr").toLowerCase(),
            metadata: {
                orderId: paymentData.order_id,
                userId,
                paymentId: paymentData.id
            },
            automatic_payment_methods: {
                enabled: true
            }
        });

        const paymentAttempt = await CPIPaymentAttemptsTableRepo({
            paymentId: paymentData.id,
            providerName: "stripe",
            status: "pending",
            amount: paymentData.amount,
            currency: paymentData.currency,
            providerOrderId: paymentIntent.id
        });

        return {
            paymentAttemptId: paymentAttempt.id,
            orderId: paymentData.order_id,
            amount: paymentData.amount,
            currency: paymentData.currency,
            provider: "stripe",
            clientSecret: paymentIntent.client_secret,
            providerOrderId: paymentIntent.id,
            stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"
        };

    }catch(error){
        console.error("Stripe Order Creation Error:", error.message);

        if(error.type === 'StripeAuthenticationError'){
            throw new ApiError(
                400,
                "Invalid Stripe API Key: Please configure a valid STRIPE_SECRET_KEY in server/.env or use Razorpay."
            );
        }

        throw new ApiError(
            error.statusCode || 400,
            `Stripe Error: ${error.message || "Failed to create Stripe payment intent"}`
        );
    }
};

const createPayment = async ({
    userId,
    orderId
}) => {
    const orderData = await getOrderForPayment({
        userId,
        orderId
    });

    if (!orderData) {
        throw new ApiError(404, "Order not found");
    }

    const amount = orderData.total_amount;
    const currency = orderData.currency || "INR";

    const { amt } = paymentDataValidator({
        userId,
        orderId,
        amount,
        currency
    });

    const payment = await CPIPaymentTableRepo({
        userId,
        orderId,
        amount: amt,
        currency
    });

    if(!payment){
        throw new ApiError(
            500,
            "Failed to create entry in payment table"
        );
    }

    return payment;
};

const createPaymentAttemptsService = async ({
    userId,
    body
}) => {

    const {
        orderId,
        vendor
    } = body || {};

    const paymentVendor = vendor?.trim()?.toLowerCase();

    if(!orderId){
        throw new ApiError(
            400,
            "Please provide order ID"
        );
    }

    if(
        !paymentVendor || 
        !ALLOWED_PAYMENT_VENDORS.includes(paymentVendor)
    ){
        throw new ApiError(
            400, 
            `Payment vendor is invalid. Allowed: ${ALLOWED_PAYMENT_VENDORS.join(", ")}`
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
        return await createRazorpayOrder({ 
            paymentData 
        });

    }else if(paymentVendor === "stripe"){
        return await createStripeOrder({ 
            paymentData,
            userId
        });
    }
};

const verifyRazorpayPayment = async ({
    body,
    paymentData
}) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    } = body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError(400, "Missing Razorpay verification parameters");
    }

    const isValid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature
    });

    if (!isValid) {
        throw new ApiError(400, "Razorpay cryptographic payment verification failed");
    }

    return {
        providerPaymentId: razorpay_payment_id,
        providerOrderId: razorpay_order_id
    };
};

const verifyStripePayment = async ({
    body,
    paymentData
}) => {
    const { paymentIntentId } = body || {};

    if (!paymentIntentId) {
        throw new ApiError(400, "Stripe PaymentIntent ID is required for verification");
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
        throw new ApiError(404, "Stripe PaymentIntent not found");
    }

    if (paymentIntent.status !== "succeeded") {
        throw new ApiError(400, `Stripe payment not completed. Status: ${paymentIntent.status}`);
    }

    if (paymentIntent.metadata?.orderId && paymentIntent.metadata.orderId !== paymentData.order_id) {
        throw new ApiError(400, "Stripe PaymentIntent order mismatch");
    }

    return {
        providerPaymentId: paymentIntent.id,
        providerOrderId: paymentIntent.id
    };
};

const verifyPaymentService = async ({
    userId,
    body,
    params
}) => {

    const orderId = body?.orderId || params?.orderId;
    const paymentVendor = (body?.paymentVendor || body?.vendor)?.trim()?.toLowerCase();
    const paymentAttemptId = params?.paymentAttemptId || body?.paymentAttemptId;

    if(!orderId){
        throw new ApiError(
            400,
            "Order ID is required"
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

    const paymentData = await fetchPaymentDetailsRepo({
        userId,
        orderId
    });

    if(!paymentData){
        throw new ApiError(
            404,
            "Payment record not found for this order"
        );
    }

    // Idempotent check
    if(
        paymentData.status === "success" || 
        paymentData.status === "paid"
    ){
        return {
            orderId,
            status: "success",
            message: "Payment already verified successfully"
        };
    }

    let verificationResult = null;
    if(paymentVendor === "razorpay") {
        verificationResult = await verifyRazorpayPayment({ body, paymentData });
    } else if (paymentVendor === "stripe") {
        verificationResult = await verifyStripePayment({ body, paymentData });
    }

    // Update payment attempt if ID provided
    if (paymentAttemptId) {
        await updatePaymentAttemptRepo({
            paymentAttemptId,
            status: "success",
            providerPaymentId: verificationResult.providerPaymentId
        });
    }

    // Update primary payment status
    await updatePaymentStatusRepo({
        paymentId: paymentData.id,
        status: "success"
    });

    // Publish payment success event to Kafka
    const paymentSuccessEvent = createPaymentEvent({
        eventType: KAFKA_EVENTS.PAYMENT.SUCCESS,
        eventData: {
            orderId,
            userId,
            paymentId: paymentData.id,
            paymentVendor,
            providerPaymentId: verificationResult.providerPaymentId,
            amount: paymentData.amount
        }
    });

    try{
        await publishEvent({
            topic: KAFKA_TOPICS.PAYMENT,
            key: orderId,
            event: paymentSuccessEvent
        });
    } catch (kafkaError) {
        console.error("[Payment Service] Kafka publish error on payment success:", kafkaError);
        // Fallback: save to outbox table
        try {
            await CPIPaymentOutboxsTableRepo({
                paymentId: paymentData.id,
                eventType: KAFKA_EVENTS.PAYMENT.SUCCESS,
                payload: paymentSuccessEvent
            });
        } catch (outboxErr) {
            console.error("[Payment Service] Failed to save to outbox:", outboxErr);
        }
    }

    return {
        orderId,
        status: "success",
        paymentId: paymentData.id,
        providerPaymentId: verificationResult.providerPaymentId
    };
};


export {
    createPaymentAttemptsService,
    verifyPaymentService
};