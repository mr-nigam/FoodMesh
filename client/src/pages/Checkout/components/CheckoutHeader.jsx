import {
    BiShieldQuarter
} from "react-icons/bi";


const CheckoutHeader = () => {

    return (
        <div className="mb-6 flex items-center justify-between">

            <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    Secure Payment
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Complete your transaction to place your food order
                </p>
            </div>

            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 sm:flex">
                <BiShieldQuarter className="h-4 w-4" />
                256-bit Encrypted
            </div>

        </div>
    );
};


export default CheckoutHeader;