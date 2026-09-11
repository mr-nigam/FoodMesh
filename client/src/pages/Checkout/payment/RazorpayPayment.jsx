import { useState } from "react";
import {
    BiLoaderAlt,
    BiCreditCard
} from "react-icons/bi";

import {
    createPayment,
    verifyPayment
} from "../../../services/paymentService";

import {
    loadRazorpayScript
} from "../../../utils/razorpayLoader";


const formatPrice = (paise) => {
    return `₹${(Number(paise || 0) / 100).toFixed(2)}`;
};

const RazorpayPayment = ({
    order,
    user,
    onSuccess,
    onFailure
}) => {

    const [processing, setProcessing] =
        useState(false);


    const handlePay = async () => {

        if (processing) {
            return;
        }

        if (!order?.id) {
            onFailure("Order details are missing");
            return;
        }

        try {

            setProcessing(true);

            const loaded =
                await loadRazorpayScript();

            if (!loaded) {
                throw new Error(
                    "Razorpay SDK failed to load. Please check your internet connection."
                );
            }

            const payment =
                await createPayment({
                    orderId: order.id,
                    vendor: "razorpay"
                });

            if (!payment?.providerOrderId) {
                throw new Error(
                    "Failed to initialize Razorpay payment"
                );
            }

            const {
                providerOrderId,
                paymentAttemptId,
                razorpayKeyId,
                amount,
                currency
            } = payment;


            if (!paymentAttemptId) {
                throw new Error(
                    "Payment attempt ID is missing"
                );
            }


            if (!razorpayKeyId) {
                throw new Error(
                    "Razorpay configuration is missing"
                );
            }


            if (!amount) {
                throw new Error(
                    "Payment amount is missing"
                );
            }


            const options = {

                key: razorpayKeyId,

                amount,

                currency: currency || "INR",

                name: "FoodMesh",

                description:
                    `Order #${String(order.id).slice(0, 8)}`,

                order_id: providerOrderId,

                prefill: {
                    name:
                        order.recipient_name ||
                        user?.name ||
                        "Customer",

                    email:
                        user?.email ||
                        "",

                    contact:
                        order.recipient_phone ||
                        user?.phone ||
                        ""
                },

                theme: {
                    color: "#ef4444"
                },


                handler: async (response) => {

                    try {

                        const result =
                            await verifyPayment({

                                orderId: order.id,

                                paymentVendor:
                                    "razorpay",

                                paymentAttemptId,

                                razorpay_order_id:
                                    response.razorpay_order_id,

                                razorpay_payment_id:
                                    response.razorpay_payment_id,

                                razorpay_signature:
                                    response.razorpay_signature
                            });


                        onSuccess({
                            provider: "razorpay",

                            providerPaymentId:
                                response.razorpay_payment_id,

                            providerOrderId:
                                response.razorpay_order_id,

                            orderId: order.id,

                            data: result
                        });

                    } catch (error) {

                        console.error(
                            "Razorpay verification failed:",
                            error
                        );

                        onFailure(
                            error?.response?.data?.message ||
                            error?.message ||
                            "Payment verification failed"
                        );

                    } finally {

                        setProcessing(false);

                    }
                },


                modal: {

                    ondismiss: () => {

                        setProcessing(false);

                    }

                }

            };


            const razorpay =
                new window.Razorpay(options);


            razorpay.on(
                "payment.failed",
                response => {

                    console.error(
                        "Razorpay payment failed:",
                        response?.error
                    );

                    onFailure(
                        response?.error?.description ||
                        "Payment failed"
                    );

                    setProcessing(false);
                }
            );


            razorpay.open();

        } catch (error) {

            console.error(
                "Razorpay initiation failed:",
                error
            );

            onFailure(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to initiate Razorpay payment"
            );

            setProcessing(false);
        }
    };


    return (
        <div className="space-y-4 text-center">

            <p className="text-sm text-gray-600">
                Clicking below will open Razorpay's secure
                payment checkout.
            </p>


            <button
                type="button"
                onClick={handlePay}
                disabled={processing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

                {processing ? (
                    <>
                        <BiLoaderAlt className="h-5 w-5 animate-spin" />
                        Processing Payment...
                    </>
                ) : (
                    <>
                        <BiCreditCard className="h-5 w-5" />
                        Pay {formatPrice(order.total_amount)} via Razorpay
                    </>
                )}

            </button>

        </div>
    );
};


export default RazorpayPayment;