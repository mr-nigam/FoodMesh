import { Link } from "react-router-dom";
import useAppData from '../context/useAppData';
import { useState } from "react";
import toast from "react-hot-toast";


const CartPage = () => {
    const {
        cart,
        allTotalQty,
        allTotalValue,
        loadingCart,
        updateQuantity
    } = useAppData();
    
    const [loadingItemId, setLoadingItemId] = useState(null);

    const formatPrice = (paise) => {
        return `₹${(Number(paise) / 100).toFixed(2)}`;
    };

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
        const hasUnavailable = restaurantCart.items.some((i) => !i.is_available);
        if (hasUnavailable) {
            toast.error("Some items from this restaurant are currently unavailable");
            return;
        }

        toast.success(`Proceeding to checkout for ${restaurantCart.restaurant.name}!`);
    };

    const handleCheckoutAll = () => {
        const hasUnavailable = cart.some((rc) =>
            rc.items.some((i) => !i.is_available)
        );
        if (hasUnavailable) {
            toast.error("Please remove unavailable items before proceeding to checkout");
            return;
        }

        toast.success("Proceeding to checkout for all restaurants!");
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
                            totalQty,
                            totalValue
                        } = restaurantCart;

                        return (
                            <div
                                key={restaurant.id}
                                className="overflow-hidden rounded-xl border bg-white shadow-sm"
                            >

                                {/* RESTAURANT HEADER */}
                                <div className="border-b bg-gray-50/50 p-5">

                                    <Link
                                        to={`/restaurant/${restaurant.id}`}
                                        className="text-xl font-semibold text-gray-900 hover:text-red-500 hover:underline"
                                    >
                                        {restaurant.name}
                                    </Link>

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

                                                        <span className="min-w-[1.25rem] text-center text-xs font-bold text-gray-800">
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
                                                    onClick={() => handleUpdateQuantity(item.item_id, "dec")}
                                                    className="text-xs font-medium text-red-500 transition hover:underline disabled:opacity-50"
                                                >
                                                    Remove
                                                </button>

                                            </div>

                                        </div>

                                    ))}

                                </div>


                                {/* RESTAURANT TOTAL & PER-RESTAURANT CHECKOUT */}
                                <div className="flex flex-col gap-3 border-t bg-gray-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                                    <div>
                                        <span className="text-sm font-medium text-gray-600">
                                            Subtotal for {restaurant.name}:{" "}
                                        </span>

                                        <span className="font-bold text-gray-900">
                                            {formatPrice(totalValue)}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleCheckoutSingle(restaurantCart)}
                                        disabled={items.some((i) => !i.is_available)}
                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >
                                        Order from {restaurant.name}
                                    </button>

                                </div>

                            </div>
                        );
                    })}

                </div>


                {/* ORDER SUMMARY */}
                <div className="h-fit rounded-xl border bg-white p-5 lg:sticky lg:top-6">

                    <h2 className="text-xl font-semibold">
                        Order Summary
                    </h2>

                    <div className="mt-5 space-y-3">

                        <div className="flex justify-between text-gray-600">
                            <span>
                                Total Items
                            </span>

                            <span>
                                {allTotalQty}
                            </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                            <span>
                                Restaurants
                            </span>

                            <span>
                                {cart.length}
                            </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                            <span>
                                Subtotal
                            </span>

                            <span>
                                {formatPrice(allTotalValue)}
                            </span>
                        </div>

                    </div>

                    <div className="my-5 border-t" />

                    <div className="flex justify-between text-lg font-bold">

                        <span>
                            Total Amount
                        </span>

                        <span className="text-red-600">
                            {formatPrice(allTotalValue)}
                        </span>

                    </div>


                    <button
                        type="button"
                        onClick={handleCheckoutAll}
                        disabled={
                            cart.length === 0 ||
                            cart.some((restaurantCart) =>
                                restaurantCart.items.some(
                                    (item) => !item.is_available
                                )
                            )
                        }
                        className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        Checkout All ({cart.length} Restaurant{cart.length !== 1 ? "s" : ""})
                    </button>

                </div>

            </div>

        </div>
    );
};


export default CartPage;