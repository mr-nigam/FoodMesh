import { useState } from "react";

import {
    BiLoaderAlt,
    BiMoney
} from "react-icons/bi";

import {
    confirmCod
} from '../../../services/paymentService.js';


const formatPrice = (paise) => {
    return `₹${(Number(paise || 0) / 100).toFixed(2)}`;
};

const CodPayment = ({
    order,
    onSuccess,
    onFailure
}) => {

    const [processing, setProcessing] =
        useState(false);

    const handleConfirm = async () => {

        if(processing) return;

        if(!order?.id){
            onFailure("Order details are missing");
            return;
        }

        try{
            setProcessing(true);

            const result =
                await confirmCod({
                    orderId: order.id
                });

            onSuccess({
                provider: "cod",
                orderId: order.id,
                data: result
            });

        }catch(error){
            console.error(
                "COD confirmation failed:",
                error
            );

            onFailure(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to confirm COD order"
            );

        }finally{
            setProcessing(false);
        }
    };


    return (
        <div className="space-y-4 text-center">

            <p className="text-sm text-gray-600">

                Please keep{" "}

                <strong>
                    {formatPrice(order.total_amount)}
                </strong>

                {" "}ready at the time of delivery.

            </p>

            <button
                type="button"
                onClick={handleConfirm}
                disabled={processing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

                {processing ? (
                    <>
                        <BiLoaderAlt className="h-5 w-5 animate-spin" />
                        Confirming Order...
                    </>
                ) : (
                    <>
                        <BiMoney className="h-5 w-5" />
                        Confirm Order (Cash on Delivery)
                    </>
                )}

            </button>
        </div>
    );
};


export default CodPayment;