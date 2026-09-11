const formatPrice = (paise) => {
    return `₹${(Number(paise || 0) / 100).toFixed(2)}`;
};


const OrderSummary = ({
    order
}) => {

    if(!order){
        return null;
    }

    console.log("Order Summary:", order);

    return (
        <div className="space-y-6">

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">

                <h3 className="mb-3 font-bold text-gray-900">
                    Order Details
                </h3>

                <div className="space-y-2 border-b pb-3 text-xs text-gray-500">

                    <div>
                        <span className="text-gray-400">
                            Order ID:{" "}
                        </span>

                        <span className="font-mono font-medium text-gray-700">
                            {order.order_id || order.id || order._id}
                        </span>
                    </div>

                    {order.recipient_name && (
                        <div>
                            <span className="text-gray-400">
                                Recipient:{" "}
                            </span>

                            <span className="font-medium text-gray-700">
                                {order.recipient_name}

                                {order.recipient_phone
                                    ? ` (${order.recipient_phone})`
                                    : ""}
                            </span>
                        </div>
                    )}

                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-600">

                    <div className="flex justify-between">
                        <span>Subtotal</span>

                        <span className="font-medium text-gray-800">
                            {formatPrice(order.subtotal)}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span>Delivery Fee</span>

                        <span className="font-medium text-gray-800">
                            {formatPrice(order.delivery_fee)}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span>Taxes & GST</span>

                        <span className="font-medium text-gray-800">
                            {formatPrice(order.tax_amount)}
                        </span>
                    </div>

                    <div className="flex justify-between border-t pt-2 text-sm font-bold text-gray-900">
                        <span>
                            Total Payable
                        </span>

                        <span className="text-red-600">
                            {formatPrice(order.total_amount)}
                        </span>
                    </div>

                </div>

            </div>

        </div>
    );
};


export default OrderSummary;