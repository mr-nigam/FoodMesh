import { Link } from "react-router-dom";
import useAppData from '../context/useAppData';
import { useState } from "react";
import toast from "react-hot-toast";
import { calculateCartFees, calculateRestaurantFees } from "../utils/feeCalculator";
import axios from "axios";
import { restaurantService } from "../config/constants";


const CartPage = () => {
    const {
        cart,
        allTotalQty,
        loadingCart,
        updateQuantity,
        refreshCart
    } = useAppData();
    
    const [loadingItemId, setLoadingItemId] = useState(null);

    const formatPrice = (paise) => {
        return `₹${(Number(paise) / 100).toFixed(2)}`;
    };

    // Filter restaurants where restaurant is OPEN and all items are AVAILABLE
    const validRestaurants = cart.filter((rc) =>
        rc.restaurant?.is_open !== false &&
        rc.items.every((i) => i.is_available)
    );

    const hasBlockedRestaurantsInCart = cart.some((rc) =>
        rc.restaurant?.is_open === false ||
        rc.items.some((i) => !i.is_available)
    );

    // Calculate global fees for valid restaurants (or fallback to cart if none)
    const globalFees = calculateCartFees(
        validRestaurants.length > 0 ? validRestaurants : cart
    );

    const handleUpdateQuantity = async (itemId, action) => {
        setLoadingItemId(itemId);
        try {
            await updateQuantity(itemId, action);
        } catch (error) {
            toast.error(error?.message || "Failed to update item quantity");
        } finally {
            setLoadingItemId(null);
        }
    };

    const handleCheckoutSingle = (restaurantCart) => {
        const rFees = calculateRestaurantFees(restaurantCart);
        if (restaurantCart.restaurant?.is_open === false) {
            toast.error(`${restaurantCart.restaurant.name} is currently closed`);
            return;
        }
        const hasUnavailable = restaurantCart.items.some((i) => !i.is_available);
        if (hasUnavailable) {
            toast.error("Some items from this restaurant are currently unavailable");
            return;
        }

        toast.success(
            `Proceeding to checkout for ${restaurantCart.restaurant.name} (${formatPrice(rFees.total)})!`
        );
    };

    const handleCheckoutAll = () => {
        if (validRestaurants.length === 0) {
            toast.error("No open or available restaurants to checkout right now.");
            return;
        }

        if (hasBlockedRestaurantsInCart) {
            toast.success(
                `Proceeding to checkout for ${validRestaurants.length} open/available restaurant${validRestaurants.length !== 1 ? 's' : ''} (${formatPrice(globalFees.grandTotal)})!`
            );
        } else {
            toast.success(
                `Proceeding to checkout for all restaurants (${formatPrice(globalFees.grandTotal)})!`
            );
        }
    };
    
    const handleRemoveItem = async (itemId) => {
        try {
            const { data } = await axios.delete(
                `${restaurantService}/cart/remove/${itemId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }   
                }
            );

            toast.success(
                data?.message ??
                data?.data?.message ??
                "Cart item removed successfully"
            );

            if (refreshCart) await refreshCart();

        } catch (error) {
            console.error(
                "Cart item not found or already removed",
                error
            );
            
            toast.error(error?.response?.data?.message || "Cart item not found or already removed");
        }
    };

    const handleRemoveRestaurantItems = async (restaurantId, restaurantName) => {
        const confirm = window.confirm(
            `Are you sure you want to remove all items from ${restaurantName}?`
        );

        if (!confirm) return;

        try {
            const { data } = await axios.delete(
                `${restaurantService}/cart/remove/r/${restaurantId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }   
                }
            );

            toast.success(
                data?.message ??
                data?.data?.message ??
                "Restaurant items removed successfully"
            );

            if (refreshCart) await refreshCart();

        } catch (error) {
            console.error(
                "Failed to remove restaurant items",
                error
            );
            
            toast.error(error?.response?.data?.message || "Failed to remove restaurant items");
        }
    };

    const [clearingCart, setClearingCart] = useState(false);

    const clearCart = async () => {
        const confirm = window.confirm("Are you sure you want to clear your entire cart?");

        if (!confirm) return;

        try {
            setClearingCart(true);

            const { data } = await axios.delete(
                `${restaurantService}/cart/clear`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }   
                }
            );

            toast.success(
                data?.message ??
                data?.data?.message ??
                "Cart cleared successfully"
            );

            if (refreshCart) await refreshCart();

        } catch (error) {
            console.error(
                "Failed to clear cart",
                error
            );
            
            toast.error(error?.response?.data?.message || "Failed to clear cart");

        } finally {
            setClearingCart(false);
        }
    };

    if(loadingCart){
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <p className="text-gray-500">
                    Loading cart...
                </p>
            </div>
        );
    }

    if(!cart || cart.length === 0){
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
                <h2 className="text-2xl font-semibold">
                    Your cart is empty
                </h2>

                <p className="text-gray-500">
                    Add some delicious food first.
                </p>

                <Link
                    to="/"
                    className="rounded-lg bg-red-500 px-5 py-2.5 text-white transition hover:bg-red-600"
                >
                    Browse Restaurants
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">

            <div className="mb-8">
                <h1 className="text-3xl font-bold">
                    Your Cart
                </h1>

                <p className="mt-1 text-gray-500">
                    {allTotalQty} item
                    {allTotalQty !== 1 ? "s" : ""} from {cart.length} restaurant
                    {cart.length !== 1 ? "s" : ""}
                </p>
            </div>


            <div className="grid gap-8 lg:grid-cols-[1fr_350px]">

                {/* CART */}
                <div className="space-y-6">

                    {cart.map((restaurantCart) => {

                        const {
                            restaurant,
                            items,
                            totalQty
                        } = restaurantCart;

                        const rFees = calculateRestaurantFees(restaurantCart);

                        return (
                            <div
                                key={restaurant.id}
                                className="overflow-hidden rounded-xl border bg-white shadow-sm"
                            >

                                {/* RESTAURANT HEADER */}
                                <div className="flex items-center justify-between border-b bg-gray-50/50 p-5">

                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link
                                                to={`/restaurant/${restaurant.id}`}
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
                                            {totalQty} item
                                            {totalQty !== 1 ? "s" : ""}
                                        </p>
                                    </div>

                                    {/* OPTION A: Remove All items for this Restaurant */}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRestaurantItems(restaurant.id, restaurant.name)}
                                        className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition shadow-sm"
                                    >
                                        Remove All
                                    </button>

                                </div>


                                {/* ITEMS */}
                                <div className="divide-y">

                                    {items.filter((item) => Number(item.quantity) > 0).map((item) => (

                                        <div
                                            key={item.cart_id || item.item_id}
                                            className="flex gap-4 p-5"
                                        >

                                            {/* IMAGE */}
                                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">

                                                {item.pictures?.[0] ? (
                                                    <img
                                                        src={item.pictures[0]}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                                        No image
                                                    </div>
                                                )}

                                            </div>


                                            {/* DETAILS */}
                                            <div className="flex min-w-0 flex-1 flex-col justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">
                                                        {item.name}
                                                    </h3>

                                                    {item.category && (
                                                        <p className="text-xs text-gray-500">
                                                            {item.category}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-1.5 rounded-lg border bg-gray-50 p-1">
                                                        <button
                                                            type="button"
                                                            disabled={loadingItemId === item.item_id}
                                                            onClick={() => handleUpdateQuantity(item.item_id, "dec")}
                                                            title="Decrease quantity"
                                                            className="flex h-6 w-6 items-center justify-center rounded bg-white text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:opacity-50"
                                                        >
                                                            -
                                                        </button>

                                                        <span className="min-w-5 text-center text-xs font-bold text-gray-800">
                                                            {loadingItemId === item.item_id ? "..." : item.quantity}
                                                        </span>

                                                        <button
                                                            type="button"
                                                            disabled={!item.is_available || loadingItemId === item.item_id}
                                                            onClick={() => handleUpdateQuantity(item.item_id, "inc")}
                                                            title="Increase quantity"
                                                            className="flex h-6 w-6 items-center justify-center rounded bg-white text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:opacity-50"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <span className="text-xs text-gray-500">
                                                        {formatPrice(item.price)} each
                                                    </span>
                                                </div>

                                                {!item.is_available && (
                                                    <p className="mt-1 text-xs font-medium text-red-500">
                                                        Currently unavailable
                                                    </p>
                                                )}

                                            </div>


                                            {/* ITEM TOTAL */}
                                            <div className="flex flex-col items-end justify-between text-right">

                                                <p className="font-semibold text-gray-900">
                                                    {formatPrice(
                                                        Number(item.price) *
                                                        Number(item.quantity)
                                                    )}
                                                </p>

                                                <button
                                                    type="button"
                                                    disabled={loadingItemId === item.item_id}
                                                    onClick={() => handleRemoveItem(item.item_id)}
                                                    className="text-xs font-medium text-red-500 transition hover:underline disabled:opacity-50"
                                                >
                                                    Remove
                                                </button>

                                            </div>

                                        </div>

                                    ))}

                                </div>


                                {/* RESTAURANT BILL BREAKDOWN & CHECKOUT */}
                                <div className="border-t bg-gray-50/50 p-5 space-y-3">
                                    <div className="text-xs space-y-1.5 text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Item Subtotal</span>
                                            <span className="font-medium text-gray-800">{formatPrice(rFees.subtotal)}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span>Delivery Fee</span>
                                            <span>
                                                {rFees.isFreeDelivery ? (
                                                    <span className="font-semibold text-green-600">FREE</span>
                                                ) : (
                                                    formatPrice(rFees.deliveryFee)
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span>Taxes & GST (5%)</span>
                                            <span>{formatPrice(rFees.taxes)}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span>Packaging Charge</span>
                                            <span>{formatPrice(rFees.packagingFee)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <span className="text-sm font-medium text-gray-600">
                                                Total for {restaurant.name}:{" "}
                                            </span>
                                            <span className="text-lg font-bold text-gray-900">
                                                {formatPrice(rFees.total)}
                                            </span>
                                        </div>

                                        {restaurant.is_open === false ? (
                                            <div className="rounded-lg bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 border border-red-200">
                                                🔴 Restaurant is currently closed
                                            </div>
                                        ) : items.some((i) => !i.is_available) ? (
                                            <div className="rounded-lg bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 border border-amber-200">
                                                ⚠️ Contains unavailable items — remove them to order
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleCheckoutSingle(restaurantCart)}
                                                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                                            >
                                                Order from {restaurant.name} • {formatPrice(rFees.total)}
                                            </button>
                                        )}
                                    </div>
                                </div>

                            </div>
                        );
                    })}

                </div>


                {/* ORDER SUMMARY */}
                <div className="h-fit rounded-xl border bg-white p-5 lg:sticky lg:top-6 shadow-sm">

                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Order Summary
                        </h2>
                        {hasBlockedRestaurantsInCart && validRestaurants.length > 0 && (
                            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                {validRestaurants.length}/{cart.length} Available
                            </span>
                        )}
                    </div>

                    <div className="mt-4 space-y-2.5 text-sm text-gray-600">

                        <div className="flex justify-between">
                            <span>
                                Items ({globalFees.totalItemCount})
                            </span>
                            <span className="font-medium text-gray-800">
                                {formatPrice(globalFees.totalItemSubtotal)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>
                                Delivery Fees ({globalFees.restaurantCount} restaurant{globalFees.restaurantCount !== 1 ? 's' : ''})
                            </span>
                            <span>
                                {formatPrice(globalFees.totalDeliveryFee)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>
                                Taxes & GST
                            </span>
                            <span>
                                {formatPrice(globalFees.totalTaxes)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>
                                Packaging Charges
                            </span>
                            <span>
                                {formatPrice(globalFees.totalPackagingFee)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>
                                Platform Fee
                            </span>
                            <span>
                                {formatPrice(globalFees.platformFee)}
                            </span>
                        </div>

                    </div>

                    <div className="my-4 border-t" />

                    <div className="flex justify-between text-lg font-bold">

                        <span>
                            Grand Total
                        </span>

                        <span className="text-red-600">
                            {formatPrice(globalFees.grandTotal)}
                        </span>

                    </div>


                    <button
                        type="button"
                        onClick={handleCheckoutAll}
                        disabled={validRestaurants.length === 0}
                        className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 shadow-sm"
                    >
                        {validRestaurants.length === 0
                            ? "No Open/Available Restaurants to Checkout"
                            : hasBlockedRestaurantsInCart
                            ? `Checkout Available (${validRestaurants.length} of ${cart.length}) • ${formatPrice(globalFees.grandTotal)}`
                            : `Checkout All • ${formatPrice(globalFees.grandTotal)}`}
                    </button>

                    {hasBlockedRestaurantsInCart && validRestaurants.length > 0 && (
                        <p className="mt-2 text-center text-xs text-amber-600 font-medium">
                            ℹ️ {cart.length - validRestaurants.length} restaurant{cart.length - validRestaurants.length !== 1 ? 's' : ''} excluded from checkout (closed or unavailable items).
                        </p>
                    )}

                    {/* OPTION B: Clear Entire Cart Button */}
                    <button
                        type="button"
                        onClick={clearCart}
                        disabled={clearingCart || cart.length === 0}
                        className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        {clearingCart ? "Clearing..." : "Clear Entire Cart"}
                    </button>

                </div>

            </div>

        </div>
    );
};


export default CartPage;