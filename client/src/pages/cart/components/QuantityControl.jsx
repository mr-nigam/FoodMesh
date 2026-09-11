const QuantityControl = ({
    quantity,
    disabled,
    onDecrease,
    onIncrease,
}) => {
    
    return (
        <div className="flex items-center gap-1.5 rounded-lg border bg-gray-50 p-1">
            <button
                type="button"
                disabled={disabled}
                onClick={onDecrease}
                title="Decrease quantity"
                aria-label="Decrease quantity"
                className="flex h-6 w-6 items-center justify-center rounded bg-white text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:opacity-50"
            >
                -
            </button>

            <span className="min-w-5 text-center text-xs font-bold text-gray-800">
                {disabled ? "..." : quantity}
            </span>

            <button
                type="button"
                disabled={disabled}
                onClick={onIncrease}
                title="Increase quantity"
                aria-label="Increase quantity"
                className="flex h-6 w-6 items-center justify-center rounded bg-white text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:opacity-50"
            >
                +
            </button>
        </div>
    );
};


export default QuantityControl;