import {
    Link,
    useLocation,
    useParams
} from "react-router-dom";

import {
    useState
} from "react";

import {
    BiArrowBack,
    BiFoodMenu,
    BiLoaderAlt
} from "react-icons/bi";

import toast from "react-hot-toast";

import useAppData from "../../context/useAppData";

import useCheckoutOrder from "./hooks/useCheckoutOrder";

import CheckoutHeader from "./components/CheckoutHeader";
import OrderSummary from "./components/OrderSummary";
import PaymentError from "./components/PaymentError";
import PaymentSuccess from "./components/PaymentSuccess";
import PaymentMethodSelector from "./components/PaymentMethodSelector";
import PaymentAction from "./components/PaymentAction";


const Checkout = () => {
    const {
        orderId
    } = useParams();

    const location =
        useLocation();

    const { user } = useAppData();


    /*
     * Optional optimization.
     *
     * Cart can pass the order so the page
     * renders immediately.
     *
     * But orderId remains the canonical identity
     * and useCheckoutOrder still fetches the
     * authoritative server-side order.
     */
    const initialOrder =
        location.state?.order || null;

    const {
        order,
        loading,
        error
    } =
        useCheckoutOrder({
            orderId,
            initialOrder
        });

    console.log(order);
    
    const [
        selectedVendor,
        setSelectedVendor
    ] = useState("razorpay");

    const [
        paymentStatus,
        setPaymentStatus
    ] = useState("idle");

    const [
        paymentResult,
        setPaymentResult
    ] = useState(null);

    const [
        errorMessage,
        setErrorMessage
    ] = useState("");

    const handleVendorSelect = vendor => {
        if(paymentStatus === "processing"){
            return;
        }

        setSelectedVendor(vendor);
        setErrorMessage("");
        setPaymentStatus("idle");
        setPaymentResult(null);
    };

    const handlePaymentSuccess = result => {
        setPaymentResult(result);
        setPaymentStatus("success");
        setErrorMessage("");

        toast.success(
            result?.provider === "cod"
                ? "Order confirmed successfully!"
                : "Payment verified successfully!"
        );
    };

    const handlePaymentFailure = message => {
        setErrorMessage(
            message ||
            "Payment failed. Please try again."
        );

        setPaymentStatus("failed");
    };


    /*
     * Loading state.
     *
     * If initialOrder exists, the page can render
     * while the authoritative GET is running.
     */
    if(loading && !order){
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">

                <BiLoaderAlt className="h-8 w-8 animate-spin text-red-500" />

                <p className="font-medium text-gray-500">
                    Loading checkout details...
                </p>

            </div>
        );
    }


    /*
     * Failed to load order.
     */
    if(error && !order){

        return (
            <div className="mx-auto max-w-lg px-4 py-16 text-center">

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">

                    <BiFoodMenu className="h-8 w-8" />

                </div>


                <h2 className="text-2xl font-bold text-gray-800">
                    Unable to Load Order
                </h2>


                <p className="mt-2 text-sm text-gray-500">
                    {error}
                </p>


                <Link
                    to="/account"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                    <BiArrowBack className="h-4 w-4" />
                    Back to Orders
                </Link>

            </div>
        );
    }


    /*
     * No order.
     */
    if (!order) {

        return (
            <div className="mx-auto max-w-lg px-4 py-16 text-center">

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">

                    <BiFoodMenu className="h-8 w-8" />

                </div>


                <h2 className="text-2xl font-bold text-gray-800">
                    No Checkout Order
                </h2>


                <p className="mt-2 text-sm text-gray-500">
                    This order could not be loaded.
                </p>


                <Link
                    to="/account"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                    <BiArrowBack className="h-4 w-4" />
                    Back to Orders
                </Link>

            </div>
        );
    }


    /*
     * Important:
     *
     * Backend should return authoritative status.
     *
     * Don't allow payment against an already
     * confirmed/paid order.
     *
     * Adjust these status names to match your
     * actual Order Service enum.
     */
    const alreadyPaid =
        order.payment_status === "paid" ||
        order.payment_status === "succeeded" ||
        order.status === "confirmed" ||
        order.status === "preparing" ||
        order.status === "out_for_delivery" ||
        order.status === "delivered";


    if (alreadyPaid) {

        return (
            <div className="mx-auto max-w-lg px-4 py-16 text-center">

                <div className="rounded-3xl border border-green-100 bg-white p-8 shadow-lg">

                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">

                        <BiFoodMenu className="h-8 w-8" />

                    </div>


                    <h1 className="text-2xl font-bold text-gray-900">
                        Order Already Confirmed
                    </h1>


                    <p className="mt-2 text-sm text-gray-500">
                        This order has already been paid or confirmed.
                    </p>


                    <Link
                        to="/account"
                        className="mt-6 inline-flex rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white"
                    >
                        View Orders
                    </Link>

                </div>

            </div>
        );
    }


    /*
     * Payment success screen.
     */
    if (paymentStatus === "success") {

        return (
            <PaymentSuccess
                order={order}
                paymentResult={paymentResult}
            />
        );
    }


    return (
        <div className="mx-auto max-w-5xl px-4 py-8">

            <CheckoutHeader />


            {errorMessage && (
                <PaymentError
                    message={errorMessage}
                />
            )}


            <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

                <div className="space-y-6">

                    <PaymentMethodSelector
                        selectedVendor={selectedVendor}
                        onSelect={handleVendorSelect}
                    />


                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">

                        <PaymentAction
                            vendor={selectedVendor}
                            order={order}
                            user={user}
                            onSuccess={
                                handlePaymentSuccess
                            }
                            onFailure={
                                handlePaymentFailure
                            }
                        />

                    </div>

                </div>


                <OrderSummary
                    order={order}
                />

            </div>

        </div>
    );
};


export default Checkout;