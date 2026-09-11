import {
    BiCreditCard,
    BiMoney
} from "react-icons/bi";


const PAYMENT_METHODS = [
    {
        id: "razorpay",
        title: "Razorpay",
        badge: "Fast & Recommended",
        description:
            "UPI, GooglePay, PhonePe, Paytm, Cards, NetBanking and Wallets"
    },
    {
        id: "stripe",
        title: "Stripe (Cards)",
        badge: "Global",
        description:
            "Visa, Mastercard, American Express and International Cards"
    },
    {
        id: "cod",
        title: "Cash on Delivery",
        badge: null,
        description:
            "Pay in cash when your food is delivered to your doorstep"
    }
];

const PaymentMethodSelector = ({
    selectedVendor,
    onSelect
}) => {

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">

            <h2 className="mb-4 text-lg font-bold text-gray-900">
                Choose Payment Method
            </h2>

            <div className="space-y-3">

                {PAYMENT_METHODS.map(method => {

                    const selected =
                        selectedVendor === method.id;

                    return (
                        <label
                            key={method.id}
                            onClick={() => onSelect(method.id)}
                            className={`
                                flex cursor-pointer items-start
                                justify-between rounded-2xl border p-4
                                transition
                                ${
                                    selected
                                        ? "border-red-500 bg-red-50/30 ring-2 ring-red-500/20"
                                        : "border-gray-200 hover:border-gray-300"
                                }
                            `}
                        >

                            <div className="flex items-start gap-3.5">

                                <input
                                    type="radio"
                                    name="paymentVendor"
                                    value={method.id}
                                    checked={selected}
                                    onChange={() =>
                                        onSelect(method.id)
                                    }
                                    className="mt-1 h-4 w-4"
                                />

                                <div>

                                    <div className="flex items-center gap-2">

                                        <span className="font-bold text-gray-900">
                                            {method.title}
                                        </span>

                                        {method.badge && (
                                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                                                {method.badge}
                                            </span>
                                        )}

                                    </div>

                                    <p className="mt-1 text-xs text-gray-500">
                                        {method.description}
                                    </p>

                                    {method.id === "razorpay" && (
                                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-400">

                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">
                                                UPI
                                            </span>

                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">
                                                Cards
                                            </span>

                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">
                                                NetBanking
                                            </span>

                                        </div>
                                    )}
                                </div>
                            </div>


                            {method.id === "stripe" && (
                                <BiCreditCard className="h-6 w-6 text-indigo-500" />
                            )}

                            {method.id === "cod" && (
                                <BiMoney className="h-6 w-6 text-emerald-500" />
                            )}

                        </label>
                    );
                })}

            </div>

        </div>
    );
};


export default PaymentMethodSelector;