import { useState } from "react";

import {
    loadStripe
} from "@stripe/stripe-js";

import {
    Elements
} from "@stripe/react-stripe-js";

import {
    BiLoaderAlt
} from "react-icons/bi";

import StripeCardForm from "./StripeCardForm";

import {
    createPayment
} from "../../../services/paymentService";


const StripePayment = ({
    order,
    onSuccess,
    onFailure
}) => {

    const [initializing, setInitializing] =
        useState(false);

    const [clientSecret, setClientSecret] =
        useState(null);

    const [stripePromise, setStripePromise] =
        useState(null);

    const [paymentAttemptId, setPaymentAttemptId] =
        useState(null);


    const initializePayment = async () => {
        if(initializing) return;

        if(!order?.id){
            onFailure("Order details are missing");
            return;
        }

        if(clientSecret) return;

        try{
            setInitializing(true);

            const payment =
                await createPayment({
                    orderId: order.id,
                    vendor: "stripe"
                });


            if(!payment?.clientSecret){
                throw new Error(
                    "Failed to receive Stripe client secret"
                );
            }


            if(!payment?.paymentAttemptId){
                throw new Error(
                    "Stripe payment attempt ID is missing"
                );
            }

            if(!payment?.stripePublishableKey){
                throw new Error(
                    "Stripe publishable key is missing"
                );
            }

            const promise =
                loadStripe(
                    payment.stripePublishableKey
                );

            setStripePromise(promise);

            setClientSecret(
                payment.clientSecret
            );

            setPaymentAttemptId(
                payment.paymentAttemptId
            );

        }catch(error){
            console.error(
                "Stripe initialization failed:",
                error
            );

            onFailure(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to initialize Stripe"
            );

        }finally{
            setInitializing(false);
        }
    };


    if(initializing){
        return (
            <div className="flex items-center justify-center gap-2 py-6 text-gray-500">

                <BiLoaderAlt className="h-5 w-5 animate-spin text-indigo-500" />

                <span className="text-sm font-medium">
                    Initializing Stripe...
                </span>

            </div>
        );
    }


    if(
        stripePromise &&
        clientSecret &&
        paymentAttemptId
    ){
        return (
            <Elements
                stripe={stripePromise}
                options={{
                    clientSecret
                }}
            >
                <StripeCardForm
                    clientSecret={clientSecret}
                    orderId={order.id}
                    paymentAttemptId={paymentAttemptId}
                    amount={order.total_amount}
                    onSuccess={onSuccess}
                    onError={onFailure}
                />
            </Elements>
        );
    }

    return (
        <div className="space-y-4">

            <p className="text-sm text-gray-600">
                Pay securely using your credit or debit card.
            </p>

            <button
                type="button"
                onClick={initializePayment}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
                Load Stripe Card Checkout
            </button>

        </div>
    );
};


export default StripePayment;