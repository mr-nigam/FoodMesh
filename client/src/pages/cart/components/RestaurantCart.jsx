import { Link } from "react-router-dom";

import { calculateRestaurantFees } from "../../../utils/feeCalculator";
import { canCheckoutRestaurant } from "../utils/cartValidation";

import CartItem from "./CartItem";
import RestaurantBill from "./RestaurantBill";


const RestaurantCart = ({
    restaurantCart,
    pendingItemId,
    pendingAction,
    checkingOutRestaurantId,
    onUpdateQuantity,
    onRemoveItem,
    onRemoveRestaurant,
    onCheckout,
}) => {
    const {
        restaurant = {},
        items = [],
        totalQty = 0,
    } = restaurantCart;

    const restaurantId = restaurant.id ?? restaurant._id;

    const visibleItems = items.filter(
        (item) => Number(item.quantity || 0) > 0
    );

    const fees = calculateRestaurantFees(restaurantCart);
    const canCheckout = canCheckoutRestaurant(restaurantCart);
    const isCheckingOut =
        checkingOutRestaurantId === restaurantId;

    return (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-gray-50/50 p-5">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            to={`/restaurant/${restaurantId}`}
                            className="text-xl font-semibold text-gray-900 hover:text-red-500 hover:underline"
                        >
                            {restaurant.name}
                        </Link>

                        {restaurant.is_open === false && (
                            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                                🔴 Closed
                            </span>
                        )}
                    </div>

                    {restaurant.address && (
                        <p className="mt-1 text-sm text-gray-500">
                            {restaurant.address}
                        </p>
                    )}

                    <p className="mt-2 text-sm text-gray-600">
                        {totalQty} item{totalQty !== 1 ? "s" : ""}
                    </p>
                </div>

                <button
                    type="button"
                    disabled={Boolean(pendingAction)}
                    onClick={() =>
                        onRemoveRestaurant(
                            restaurantId,
                            restaurant.name
                        )
                    }
                    className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Remove All
                </button>
            </div>

            <div className="divide-y">
                {visibleItems.map((item) => {
                    const itemId =
                        item.cart_id ??
                        item.cartId ??
                        item.item_id ??
                        item.itemId;

                    const isPending =
                        pendingItemId === itemId;

                    return (
                        <CartItem
                            key={itemId}
                            item={item}
                            isPending={isPending}
                            onDecrease={() =>
                                onUpdateQuantity(
                                    itemId,
                                    "dec"
                                )
                            }
                            onIncrease={() =>
                                onUpdateQuantity(
                                    itemId,
                                    "inc"
                                )
                            }
                            onRemove={() =>
                                onRemoveItem(itemId)
                            }
                        />
                    );
                })}
            </div>

            <RestaurantBill
                restaurant={restaurant}
                fees={fees}
                canCheckout={canCheckout}
                isCheckingOut={isCheckingOut}
                onCheckout={() =>
                    onCheckout(restaurantCart)
                }
            />
        </div>
    );
};


export default RestaurantCart;