const formatPrice = (paise) => {
    return `₹${(Number(paise || 0) / 100).toFixed(2)}`;
};


const CartSummary = ({
    fees,
    validRestaurantCount,
    totalRestaurantCount,
    hasBlockedRestaurants,
    isCheckingOut,
    isClearingCart,
    onCheckout,
    onClear,
}) => {
    const hasValidRestaurants = validRestaurantCount > 0;

    return (
        <div className="h-fit rounded-xl border bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                    Order Summary
                </h2>

                {hasBlockedRestaurants &&
                    hasValidRestaurants && (
                        <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                            {validRestaurantCount}/
                            {totalRestaurantCount} Available
                        </span>
                    )}
            </div>

            <div className="mt-4 space-y-2.5 text-sm text-gray-600">
                <div className="flex justify-between">
                    <span>
                        Items ({fees.totalItemCount})
                    </span>
                    <span className="font-medium text-gray-800">
                        {formatPrice(fees.totalItemSubtotal)}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>
                        Delivery Fees ({fees.restaurantCount}{" "}
                        restaurant
                        {fees.restaurantCount !== 1
                            ? "s"
                            : ""})
                    </span>
                    <span>
                        {formatPrice(fees.totalDeliveryFee)}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>Taxes & GST</span>
                    <span>{formatPrice(fees.totalTaxes)}</span>
                </div>

                <div className="flex justify-between">
                    <span>Packaging Charges</span>
                    <span>
                        {formatPrice(fees.totalPackagingFee)}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span>{formatPrice(fees.platformFee)}</span>
                </div>
            </div>

            <div className="my-4 border-t" />

            <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span className="text-red-600">
                    {formatPrice(fees.grandTotal)}
                </span>
            </div>

            <button
                type="button"
                onClick={onCheckout}
                disabled={
                    !hasValidRestaurants ||
                    isCheckingOut ||
                    isClearingCart
                }
                className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
                {isCheckingOut
                    ? "Creating Order..."
                    : !hasValidRestaurants
                    ? "No Open/Available Restaurants"
                    : hasBlockedRestaurants
                    ? `Checkout Available (${validRestaurantCount} of ${totalRestaurantCount}) • ${formatPrice(
                          fees.grandTotal
                      )}`
                    : `Checkout All • ${formatPrice(
                          fees.grandTotal
                      )}`}
            </button>

            {hasBlockedRestaurants && hasValidRestaurants && (
                <p className="mt-2 text-center text-xs font-medium text-amber-600">
                    ℹ️{" "}
                    {totalRestaurantCount -
                        validRestaurantCount}{" "}
                    restaurant
                    {totalRestaurantCount -
                        validRestaurantCount !==
                    1
                        ? "s"
                        : ""}{" "}
                    excluded from checkout.
                </p>
            )}

            <button
                type="button"
                onClick={onClear}
                disabled={isClearingCart || isCheckingOut}
                className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
                {isClearingCart
                    ? "Clearing..."
                    : "Clear Entire Cart"}
            </button>
        </div>
    );
};


export default CartSummary;