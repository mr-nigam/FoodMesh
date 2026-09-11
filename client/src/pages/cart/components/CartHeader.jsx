const CartHeader = ({ totalQty, restaurantCount }) => {
    return (
        <div className="mb-8">
            <h1 className="text-3xl font-bold">Your Cart</h1>

            <p className="mt-1 text-gray-500">
                {totalQty} item{totalQty !== 1 ? "s" : ""} from{" "}
                {restaurantCount} restaurant
                {restaurantCount !== 1 ? "s" : ""}
            </p>
        </div>
    );
};


export default CartHeader;