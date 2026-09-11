import {
    BiErrorCircle
} from "react-icons/bi";


const PaymentError = ({
    message
}) => {

    if(!message) return null;

    return (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <BiErrorCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>

                <p className="font-semibold">
                    Payment Failed
                </p>

                <p className="mt-0.5 text-xs">
                    {message}
                </p>

            </div>
        </div>
    );
};


export default PaymentError;