import QuantityControl from "./QuantityControl";

const formatPrice = (paise) => {
    return `₹${(Number(paise || 0) / 100).toFixed(2)}`;
};

const CartItem = ({
    item,
    isPending,
    onIncrease,
    onDecrease,
    onRemove,
}) => {
    const quantity = Number(item.quantity || 0);
    const itemTotal = Number(item.price || 0) * quantity;

    return (
        <div className="flex gap-4 p-5">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {item.pictures?.[0] ? (
                    <img
                        src={item.pictures[0]}
                        alt={item.name || "Cart item"}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        No image
                    </div>
                )}
            </div>

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
                    <QuantityControl
                        quantity={quantity}
                        disabled={isPending}
                        onDecrease={onDecrease}
                        onIncrease={onIncrease}
                    />

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

            <div className="flex flex-col items-end justify-between text-right">
                <p className="font-semibold text-gray-900">
                    {formatPrice(itemTotal)}
                </p>

                <button
                    type="button"
                    disabled={isPending}
                    onClick={onRemove}
                    className="text-xs font-medium text-red-500 transition hover:underline disabled:opacity-50"
                >
                    {isPending ? "Removing..." : "Remove"}
                </button>
            </div>
        </div>
    );
};


export default CartItem;
