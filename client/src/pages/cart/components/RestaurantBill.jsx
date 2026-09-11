const formatPrice = (paise) => {
    return `₹${(Number(paise || 0) / 100).toFixed(2)}`;
};

const RestaurantBill = ({
    restaurant,
    fees,
    canCheckout,
    isCheckingOut,
    onCheckout,
}) => {
    return (
        <div className="space-y-3 border-t bg-gray-50/50 p-5">
            <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                    <span>Item Subtotal</span>
                    <span className="font-medium text-gray-800">
                        {formatPrice(fees.subtotal)}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>
                        {fees.isFreeDelivery ? (
                            <span className="font-semibold text-green-600">
                                FREE
                            </span>
                        ) : (
                            formatPrice(fees.deliveryFee)
                        )}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>Taxes & GST</span>
                    <span>{formatPrice(fees.taxes)}</span>
                </div>

                <div className="flex justify-between">
                    <span>Packaging Charge</span>
                    <span>{formatPrice(fees.packagingFee)}</span>
                </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <span className="text-sm font-medium text-gray-600">
                        Total for {restaurant.name}:{" "}
                    </span>

                    <span className="text-lg font-bold text-gray-900">
                        {formatPrice(fees.total)}
                    </span>
                </div>

                {!canCheckout ? (
                    restaurant.is_open === false ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700">
                            🔴 Restaurant is currently closed
                        </div>
                    ) : (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700">
                            ⚠️ Contains unavailable items
                        </div>
                    )
                ) : (
                    <button
                        type="button"
                        disabled={isCheckingOut}
                        onClick={onCheckout}
                        className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isCheckingOut
                            ? "Creating Order..."
                            : `Order from ${restaurant.name} • ${formatPrice(
                                  fees.total
                              )}`}
                    </button>
                )}
            </div>
        </div>
    );
};


export default RestaurantBill;