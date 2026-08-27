import { Link} from "react-router-dom";
import useAppData from '../context/useAppData';


const CartPage = () => {
    const {
        cart,
        allTotalQty,
        allTotalValue,
        loadingCart
    } = useAppData();

    // const navigate = useNavigate();
    // const [clearingCart, setClearingCart] = useState(false);

    const formatPrice = (paise) => {
        return `₹${(Number(paise) / 100).toFixed(2)}`;
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
                    to="/restaurants"
                    className="rounded-lg bg-black px-5 py-2.5 text-white"
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
                    {allTotalQty !== 1 ? "s" : ""} in your cart
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
                                className="overflow-hidden rounded-xl border bg-white"
                            >

                                {/* RESTAURANT HEADER */}
                                <div className="border-b p-5">

                                    <Link
                                        to={`/restaurant/${restaurant.id}`}
                                        className="text-xl font-semibold hover:underline"
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

                                    {items.map((item) => (

                                        <div
                                            key={item.cart_id}
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
                                            <div className="flex min-w-0 flex-1 flex-col">

                                                <h3 className="font-semibold">
                                                    {item.name}
                                                </h3>

                                                {item.category && (
                                                    <p className="text-sm text-gray-500">
                                                        {item.category}
                                                    </p>
                                                )}

                                                <p className="mt-2 text-sm">
                                                    {formatPrice(item.price)}
                                                    {" × "}
                                                    {item.quantity}
                                                </p>

                                                {!item.is_available && (
                                                    <p className="mt-1 text-sm font-medium text-red-500">
                                                        Currently unavailable
                                                    </p>
                                                )}

                                            </div>


                                            {/* ITEM TOTAL */}
                                            <div className="text-right">

                                                <p className="font-semibold">
                                                    {formatPrice(
                                                        Number(item.price) *
                                                        Number(item.quantity)
                                                    )}
                                                </p>

                                            </div>

                                        </div>

                                    ))}

                                </div>


                                {/* RESTAURANT TOTAL */}
                                <div className="flex justify-between border-t bg-gray-50 px-5 py-4">

                                    <span className="font-medium">
                                        Restaurant total
                                    </span>

                                    <span className="font-semibold">
                                        {formatPrice(totalValue)}
                                    </span>

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
                                Items
                            </span>

                            <span>
                                {allTotalQty}
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
                            Total
                        </span>

                        <span>
                            {formatPrice(allTotalValue)}
                        </span>

                    </div>


                    <button
                        disabled={
                            cart.length === 0 ||
                            cart.some((restaurantCart) =>
                                restaurantCart.items.some(
                                    (item) => !item.is_available
                                )
                            )
                        }
                        className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        Proceed to Checkout
                    </button>

                </div>

            </div>

        </div>
    );
};


export default CartPage;