import { Link } from "react-router-dom";


const CartEmptyState = () => {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
            <h2 className="text-2xl font-semibold">Your cart is empty</h2>

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
};


export default CartEmptyState;
