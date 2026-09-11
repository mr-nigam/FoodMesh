import { useState } from "react";

import toast from "react-hot-toast";

import {
    BiLoaderAlt,
    BiCreditCard
} from "react-icons/bi";

import {
    useStripe,
    useElements,
    CardElement
} from "@stripe/react-stripe-js";

import useAppData from "../../../context/useAppData";

import {
    verifyPayment
} from "../../../services/paymentService";


const StripeCardForm = ({
    clientSecret,
    orderId,
    paymentAttemptId,
    amount,
    onSuccess,
    onError
}) => {

    const stripe = useStripe();
    const elements = useElements();

    const { user } = useAppData();

    const [processing, setProcessing] =
        useState(false);

    const handleSubmit = async event => {

        event.preventDefault();

        if(processing) return;

        if(!stripe || !elements){
            toast.error(
                "Stripe is not fully initialized. Please try again."
            );

            return;
        }

        if(!clientSecret){
            toast.error(
                "Stripe client secret is missing."
            );

            return;
        }

        if(!paymentAttemptId){
            toast.error(
                "Payment attempt is missing."
            );

            return;
        }

        const cardElement = elements.getElement(CardElement);


        if(!cardElement){
            toast.error(
                "Card input is not available."
            );

            return;
        }


        try{

            setProcessing(true);

            const {
                error,
                paymentIntent
            } =
                await stripe.confirmCardPayment(
                    clientSecret,
                    {
                        payment_method: {
                            card: cardElement,

                            billing_details: {
                                name:
                                    user?.name ||
                                    "FoodMesh Customer",

                                email:
                                    user?.email ||
                                    undefined
                            }
                        }
                    }
                );


            if(error){

                onError(
                    error.message ||
                    "Card payment failed"
                );

                return;
            }


            if(!paymentIntent){
                onError(
                    "Stripe did not return a payment intent."
                );

                return;
            }


            if(
                paymentIntent.status !==
                "succeeded"
            ){
                onError(
                    `Payment status: ${paymentIntent.status}`
                );

                return;
            }


            const result =
                await verifyPayment({

                    orderId,

                    paymentVendor:
                        "stripe",

                    paymentAttemptId,

                    paymentIntentId:
                        paymentIntent.id
                });

            onSuccess({
                provider: "stripe",

                providerPaymentId:
                    paymentIntent.id,

                orderId,

                data: result
            });


        }catch(error){

            console.error(
                "Stripe payment error:",
                error
            );

            onError(
                error?.response?.data?.message ||
                error?.message ||
                "Payment verification failed"
            );

        }finally{

            setProcessing(false);
        }
    };


    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">

                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Credit or Debit Card Details
                </label>

                <div className="py-1">

                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontFamily:
                                        "Inter, system-ui, sans-serif",

                                    "::placeholder": {
                                        color: "#9ca3af"
                                    }
                                },

                                invalid: {
                                    color: "#ef4444"
                                }
                            }
                        }}
                    />

                </div>

            </div>

            <button
                type="submit"
                disabled={
                    !stripe ||
                    !elements ||
                    processing
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

                {processing ? (
                    <>
                        <BiLoaderAlt className="h-5 w-5 animate-spin" />
                        Processing Card...
                    </>
                ) : (
                    <>
                        <BiCreditCard className="h-5 w-5" />
                        Pay ₹
                        {(Number(amount) / 100).toFixed(2)}
                        {" "}with Stripe
                    </>
                )}

            </button>
        </form>
    );
};


export default StripeCardForm;