import {
    Link
} from "react-router-dom";

import {
    BiCheckCircle
} from "react-icons/bi";


const formatPrice = (paise) => {
    return `₹${(Number(paise || 0) / 100).toFixed(2)}`;
};

const PaymentSuccess = ({
    order,
    paymentResult
}) => {

    const provider = paymentResult?.provider;

    const paymentMethod =
        provider === "cod"
            ? "Cash on Delivery"
            : provider
                ? provider
                : "Payment";

    return (
        <div className="mx-auto max-w-xl px-4 py-16">

            <div className="rounded-3xl border border-green-100 bg-white p-8 text-center shadow-lg">

                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500">

                    <BiCheckCircle className="h-14 w-14" />

                </div>


                <h1 className="text-2xl font-bold text-gray-900">
                    {provider === "cod"
                        ? "Order Confirmed!"
                        : "Payment Successful!"}
                </h1>


                <p className="mt-2 text-sm text-gray-500">

                    {provider === "cod"
                        ? "Your order has been confirmed with Cash on Delivery."
                        : "Your payment has been successfully processed and your order has been confirmed."}

                </p>


                <div className="mt-6 space-y-2.5 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-left text-sm">

                    <div className="flex justify-between">

                        <span className="text-gray-500">
                            Order ID:
                        </span>

                        <span className="font-mono font-bold text-gray-800">
                            {order?.id ||
                                paymentResult?.orderId}
                        </span>

                    </div>


                    <div className="flex justify-between">

                        <span className="text-gray-500">
                            Payment Method:
                        </span>

                        <span className="font-semibold capitalize text-gray-800">
                            {paymentMethod}
                        </span>

                    </div>


                    {paymentResult?.providerPaymentId && (
                        <div className="flex justify-between">

                            <span className="text-gray-500">
                                Payment Ref ID:
                            </span>

                            <span className="max-w-55 truncate font-mono text-xs font-medium text-gray-700">
                                {paymentResult.providerPaymentId}
                            </span>

                        </div>
                    )}


                    <div className="flex justify-between border-t pt-2">

                        <span className="font-semibold text-gray-700">
                            Total:
                        </span>

                        <span className="font-bold text-red-600">
                            {formatPrice(
                                order?.total_amount
                            )}
                        </span>

                    </div>

                </div>


                <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                    <Link
                        to="/"
                        className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        Back to Home
                    </Link>


                    <Link
                        to="/account"
                        className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                    >
                        View Orders
                    </Link>
                </div>
            </div>
        </div>
    );
};


export default PaymentSuccess;