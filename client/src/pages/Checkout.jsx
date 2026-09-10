import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { 
    BiCheckCircle, 
    BiErrorCircle, 
    BiLoaderAlt, 
    BiCreditCard, 
    BiMapPin, 
    BiFoodMenu, 
    BiShieldQuarter, 
    BiArrowBack,
    BiRupee,
    BiMoney
} from "react-icons/bi";
import { 
    loadStripe 
} from "@stripe/stripe-js";
import { 
    Elements, 
    CardElement, 
    useStripe, 
    useElements 
} from "@stripe/react-stripe-js";

import { orderService, paymentService } from "../config/constants";
import { loadRazorpayScript } from "../utils/razorpayLoader";
import useAppData from "../context/useAppData";

// Lightweight Stripe Card Form Sub-component
const StripeCardForm = ({ 
    clientSecret, 
    orderId, 
    paymentAttemptId, 
    amount, 
    onSuccess, 
    onError 
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const { user } = useAppData();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            toast.error("Stripe is not fully initialized. Please try again.");
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        setProcessing(true);
        try {
            const token = localStorage.getItem("token");

            // 1. Confirm card payment with Stripe
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: user?.name || "FoodMesh Customer",
                        email: user?.email || undefined
                    }
                }
            });

            if (error) {
                onError(error.message || "Card payment failed");
                setProcessing(false);
                return;
            }

            if (paymentIntent.status === "succeeded") {
                // 2. Verify with backend
                const { data } = await axios.post(
                    `${paymentService}/verify`,
                    {
                        orderId,
                        paymentVendor: "stripe",
                        paymentAttemptId,
                        paymentIntentId: paymentIntent.id
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                toast.success("Payment verified successfully!");
                onSuccess({
                    provider: "stripe",
                    providerPaymentId: paymentIntent.id,
                    data
                });
            } else {
                onError(`Payment status: ${paymentIntent.status}`);
            }
        } catch (err) {
            console.error("Stripe confirmation error:", err);
            onError(err?.response?.data?.message || err?.message || "Payment verification failed");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
                <label className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Credit or Debit Card Details
                </label>
                <div className="py-1">
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontFamily: "Inter, system-ui, sans-serif",
                                    "::placeholder": {
                                        color: "#9ca3af"
                                    }
                                },
                                invalid: {
                                    color: "#ef4444"
                                }
                            }
                        }}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={!stripe || processing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {processing ? (
                    <>
                        <BiLoaderAlt className="h-5 w-5 animate-spin" />
                        Processing Card...
                    </>
                ) : (
                    <>
                        <BiCreditCard className="h-5 w-5" />
                        Pay ₹{(Number(amount) / 100).toFixed(2)} with Stripe
                    </>
                )}
            </button>
        </form>
    );
};

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderId: paramOrderId } = useParams();
    const { user, refreshCart } = useAppData();

    // Extract passed state from Cart Page or fallback
    const stateOrder = location.state?.order;
    const stateOrderRestaurants = location.state?.orderRestaurants;
    const stateDeliveryAddress = location.state?.deliveryAddress;

    const [order, setOrder] = useState(stateOrder || null);
    const [loadingOrder, setLoadingOrder] = useState(!stateOrder && !!paramOrderId);
    const [selectedVendor, setSelectedVendor] = useState("razorpay"); // 'razorpay' | 'stripe' | 'cod'
    
    // Gateway state
    const [initiatingPayment, setInitiatingPayment] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState("idle"); // 'idle' | 'processing' | 'success' | 'failed'
    const [paymentResult, setPaymentResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    // Stripe Elements state
    const [stripeClientSecret, setStripeClientSecret] = useState(null);
    const [stripePromise, setStripePromise] = useState(null);
    const [stripeAttemptId, setStripeAttemptId] = useState(null);

    const getAuthHeader = () => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // If order is not passed via location state, fetch it from order service
    useEffect(() => {
        const orderIdToFetch = paramOrderId || stateOrder?.id;
        if (!stateOrder && orderIdToFetch) {
            const fetchOrder = async () => {
                try {
                    setLoadingOrder(true);
                    const { data } = await axios.get(
                        `${orderService}/${orderIdToFetch}`,
                        { headers: getAuthHeader() }
                    );
                    const fetchedOrder = data?.data?.order || data?.order || data?.data;
                    setOrder(fetchedOrder);
                } catch (error) {
                    console.error("Failed to load order for payment:", error);
                    toast.error("Could not load order details");
                } finally {
                    setLoadingOrder(false);
                }
            };
            fetchOrder();
        }
    }, [paramOrderId, stateOrder]);

    const formatPrice = (paise) => {
        return `₹${(Number(paise || 0) / 100).toFixed(2)}`;
    };

    // -------------------------------------------------------------
    // RAZORPAY PAYMENT FLOW
    // -------------------------------------------------------------
    const handleRazorpayPayment = async () => {
        if (!order?.id) {
            toast.error("Order details are missing");
            return;
        }

        try {
            setInitiatingPayment(true);
            setErrorMessage("");

            // 1. Ensure Razorpay SDK is loaded
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
            }

            // 2. Create Payment Attempt on backend
            const { data } = await axios.post(
                `${paymentService}/create`,
                {
                    orderId: order.id,
                    vendor: "razorpay"
                },
                { headers: getAuthHeader() }
            );

            const paymentInfo = data?.data?.payment || data?.payment;
            if (!paymentInfo || !paymentInfo.providerOrderId) {
                throw new Error("Failed to initialize payment gateway order");
            }

            const {
                providerOrderId,
                paymentAttemptId,
                razorpayKeyId,
                amount,
                currency
            } = paymentInfo;

            // 3. Open Razorpay Checkout Modal
            const options = {
                key: razorpayKeyId || "rzp_test_TWaQFqWLH8p8lA",
                amount: amount,
                currency: currency || "INR",
                name: "FoodMesh",
                description: `Order #${order.id.slice(0, 8)}`,
                image: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
                order_id: providerOrderId,
                prefill: {
                    name: order.recipient_name || user?.name || "Customer",
                    email: user?.email || "",
                    contact: order.recipient_phone || user?.phone || ""
                },
                theme: {
                    color: "#ef4444" // FoodMesh Brand Red
                },
                handler: async function (response) {
                    try {
                        setPaymentStatus("processing");

                        // 4. Verify Payment with Backend
                        const verifyRes = await axios.post(
                            `${paymentService}/verify`,
                            {
                                orderId: order.id,
                                paymentVendor: "razorpay",
                                paymentAttemptId: paymentAttemptId,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            },
                            { headers: getAuthHeader() }
                        );

                        toast.success("Payment verified successfully!");
                        setPaymentResult({
                            provider: "razorpay",
                            providerPaymentId: response.razorpay_payment_id,
                            providerOrderId: response.razorpay_order_id,
                            orderId: order.id
                        });
                        setPaymentStatus("success");

                        if (refreshCart) refreshCart();
                    } catch (verifyError) {
                        console.error("Payment verification failed:", verifyError);
                        setErrorMessage(
                            verifyError?.response?.data?.message || 
                            "Payment verification failed on the server. Please contact support."
                        );
                        setPaymentStatus("failed");
                    }
                },
                modal: {
                    ondismiss: function () {
                        setInitiatingPayment(false);
                        toast("Payment cancelled by user", { icon: "ℹ️" });
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (response) {
                console.error("Razorpay payment failed:", response.error);
                setErrorMessage(response.error.description || "Payment failed");
                setPaymentStatus("failed");
            });

            rzp.open();
        } catch (error) {
            console.error("Razorpay initiation failed:", error);
            setErrorMessage(error?.response?.data?.message || error?.message || "Failed to initiate Razorpay payment");
            toast.error(error?.response?.data?.message || error?.message || "Failed to initiate payment");
        } finally {
            setInitiatingPayment(false);
        }
    };

    // -------------------------------------------------------------
    // STRIPE PAYMENT INITIALIZATION
    // -------------------------------------------------------------
    const handleInitStripe = async () => {
        if (!order?.id) {
            toast.error("Order details are missing");
            return;
        }

        try {
            setInitiatingPayment(true);
            setErrorMessage("");

            const { data } = await axios.post(
                `${paymentService}/create`,
                {
                    orderId: order.id,
                    vendor: "stripe"
                },
                { headers: getAuthHeader() }
            );

            const paymentInfo = data?.data?.payment || data?.payment;
            if (!paymentInfo?.clientSecret) {
                throw new Error("Failed to receive Stripe client secret");
            }

            setStripeClientSecret(paymentInfo.clientSecret);
            setStripeAttemptId(paymentInfo.paymentAttemptId);
            setStripePromise(loadStripe(paymentInfo.stripePublishableKey || "pk_test_placeholder"));
        } catch (error) {
            console.error("Stripe initialization failed:", error);
            setErrorMessage(error?.response?.data?.message || error?.message || "Failed to initialize Stripe");
            toast.error(error?.response?.data?.message || "Stripe setup failed");
        } finally {
            setInitiatingPayment(false);
        }
    };

    // Handle vendor change
    const handleVendorSelect = (vendor) => {
        setSelectedVendor(vendor);
        setErrorMessage("");
        if (vendor === "stripe" && !stripeClientSecret && order?.id) {
            handleInitStripe();
        }
    };

    // -------------------------------------------------------------
    // CASH ON DELIVERY (COD) FLOW
    // -------------------------------------------------------------
    const handleCodPayment = () => {
        setPaymentStatus("success");
        setPaymentResult({
            provider: "cod",
            orderId: order.id
        });
        toast.success("Order confirmed with Cash on Delivery!");
        if (refreshCart) refreshCart();
    };

    if (loadingOrder) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
                <BiLoaderAlt className="h-8 w-8 animate-spin text-red-500" />
                <p className="text-gray-500 font-medium">Loading checkout details...</p>
            </div>
        );
    }

    // Success Screen
    if (paymentStatus === "success") {
        return (
            <div className="mx-auto max-w-xl px-4 py-16">
                <div className="rounded-3xl border border-green-100 bg-white p-8 text-center shadow-lg">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500">
                        <BiCheckCircle className="h-14 w-14" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Your order has been confirmed and sent to the restaurant.
                    </p>

                    <div className="mt-6 rounded-2xl bg-gray-50 p-5 text-left text-sm space-y-2.5 border border-gray-100">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Order ID:</span>
                            <span className="font-mono font-bold text-gray-800">{order?.id || paymentResult?.orderId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Method:</span>
                            <span className="font-semibold capitalize text-gray-800">
                                {paymentResult?.provider === "cod" ? "Cash on Delivery" : paymentResult?.provider}
                            </span>
                        </div>
                        {paymentResult?.providerPaymentId && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Payment Ref ID:</span>
                                <span className="font-mono text-xs font-medium text-gray-700">{paymentResult.providerPaymentId}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t pt-2">
                            <span className="font-semibold text-gray-700">Total Paid:</span>
                            <span className="font-bold text-red-600">{formatPrice(order?.total_amount)}</span>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Link
                            to="/"
                            className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            Back to Home
                        </Link>
                        <Link
                            to="/account"
                            className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                        >
                            View Orders
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mx-auto max-w-lg px-4 py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                    <BiFoodMenu className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">No active checkout order</h2>
                <p className="mt-2 text-sm text-gray-500">
                    Your cart is ready. Please proceed from the Cart page to complete payment.
                </p>
                <Link
                    to="/cart"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                    <BiArrowBack className="h-4 w-4" /> Go to Cart
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Secure Payment</h1>
                    <p className="text-sm text-gray-500 mt-1">Complete your transaction to place your food order</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    <BiShieldQuarter className="h-4 w-4" /> 256-bit Encrypted
                </div>
            </div>

            {errorMessage && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
                    <BiErrorCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">Payment Failed</p>
                        <p className="text-xs mt-0.5">{errorMessage}</p>
                    </div>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                {/* PAYMENT METHOD SELECTION */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Choose Payment Method</h2>

                        <div className="space-y-3">
                            {/* Option 1: Razorpay */}
                            <label
                                onClick={() => handleVendorSelect("razorpay")}
                                className={`flex cursor-pointer items-start justify-between rounded-2xl border p-4 transition ${
                                    selectedVendor === "razorpay"
                                        ? "border-red-500 bg-red-50/30 ring-2 ring-red-500/20"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-start gap-3.5">
                                    <input
                                        type="radio"
                                        name="paymentVendor"
                                        checked={selectedVendor === "razorpay"}
                                        onChange={() => handleVendorSelect("razorpay")}
                                        className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">Razorpay</span>
                                            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                                Fast & Recommended
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            UPI (GooglePay, PhonePe, Paytm), Netbanking, Credit & Debit Cards, Wallets
                                        </p>
                                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-400">
                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">UPI</span>
                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">Cards</span>
                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">NetBanking</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-blue-600">⚡</span>
                            </label>

                            {/* Option 2: Stripe */}
                            <label
                                onClick={() => handleVendorSelect("stripe")}
                                className={`flex cursor-pointer items-start justify-between rounded-2xl border p-4 transition ${
                                    selectedVendor === "stripe"
                                        ? "border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/20"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-start gap-3.5">
                                    <input
                                        type="radio"
                                        name="paymentVendor"
                                        checked={selectedVendor === "stripe"}
                                        onChange={() => handleVendorSelect("stripe")}
                                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">Stripe (Cards)</span>
                                            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                                                Global
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Pay via Visa, Mastercard, American Express, or International Cards
                                        </p>
                                    </div>
                                </div>
                                <BiCreditCard className="h-6 w-6 text-indigo-500" />
                            </label>

                            {/* Option 3: Cash On Delivery */}
                            <label
                                onClick={() => handleVendorSelect("cod")}
                                className={`flex cursor-pointer items-start justify-between rounded-2xl border p-4 transition ${
                                    selectedVendor === "cod"
                                        ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-start gap-3.5">
                                    <input
                                        type="radio"
                                        name="paymentVendor"
                                        checked={selectedVendor === "cod"}
                                        onChange={() => handleVendorSelect("cod")}
                                        className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">Cash on Delivery</span>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Pay in cash when your food is delivered to your doorstep
                                        </p>
                                    </div>
                                </div>
                                <BiMoney className="h-6 w-6 text-emerald-500" />
                            </label>
                        </div>
                    </div>

                    {/* DYNAMIC PAYMENT ACTION CONTAINER */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
                        {selectedVendor === "razorpay" && (
                            <div className="space-y-4 text-center">
                                <p className="text-sm text-gray-600">
                                    Clicking below will open the official Razorpay payment portal with UPI, Cards, and NetBanking options.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleRazorpayPayment}
                                    disabled={initiatingPayment}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
                                >
                                    {initiatingPayment ? (
                                        <>
                                            <BiLoaderAlt className="h-5 w-5 animate-spin" />
                                            Launching Razorpay...
                                        </>
                                    ) : (
                                        <>
                                            Pay {formatPrice(order.total_amount)} via Razorpay
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {selectedVendor === "stripe" && (
                            <div className="space-y-4">
                                {initiatingPayment ? (
                                    <div className="flex items-center justify-center py-6 gap-2 text-gray-500">
                                        <BiLoaderAlt className="h-5 w-5 animate-spin text-indigo-500" />
                                        <span className="text-sm font-medium">Initializing Stripe Elements...</span>
                                    </div>
                                ) : stripePromise && stripeClientSecret ? (
                                    <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                                        <StripeCardForm
                                            clientSecret={stripeClientSecret}
                                            orderId={order.id}
                                            paymentAttemptId={stripeAttemptId}
                                            amount={order.total_amount}
                                            onSuccess={(res) => {
                                                setPaymentStatus("success");
                                                setPaymentResult(res);
                                            }}
                                            onError={(msg) => {
                                                setErrorMessage(msg);
                                                setPaymentStatus("failed");
                                            }}
                                        />
                                    </Elements>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleInitStripe}
                                        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                                    >
                                        Load Stripe Card Checkout
                                    </button>
                                )}
                            </div>
                        )}

                        {selectedVendor === "cod" && (
                            <div className="space-y-4 text-center">
                                <p className="text-sm text-gray-600">
                                    Please keep exact change of <strong>{formatPrice(order.total_amount)}</strong> ready at the time of delivery.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleCodPayment}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-emerald-700"
                                >
                                    Confirm Order (Cash on Delivery)
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ORDER SUMMARY SIDEBAR */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                        <h3 className="font-bold text-gray-900 mb-3">Order Details</h3>
                        <div className="space-y-2 text-xs text-gray-500 pb-3 border-b">
                            <div>
                                <span className="text-gray-400">Order ID: </span>
                                <span className="font-mono font-medium text-gray-700">{order.id}</span>
                            </div>
                            {order.recipient_name && (
                                <div>
                                    <span className="text-gray-400">Recipient: </span>
                                    <span className="font-medium text-gray-700">{order.recipient_name} ({order.recipient_phone})</span>
                                </div>
                            )}
                        </div>

                        {/* Address */}
                        {order.delivery_address && (
                            <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 pb-3 border-b">
                                <BiMapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-gray-800">Delivery Address</p>
                                    <p className="text-gray-500 mt-0.5">
                                        {order.delivery_address.formattedAddress || 
                                         `${order.delivery_address.addressLine1 || ''}, ${order.delivery_address.city || ''}`}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Price Breakdown */}
                        <div className="mt-4 space-y-2 text-xs text-gray-600">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-medium text-gray-800">{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery Fee</span>
                                <span className="font-medium text-gray-800">{formatPrice(order.delivery_fee)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Taxes & GST</span>
                                <span className="font-medium text-gray-800">{formatPrice(order.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-sm font-bold text-gray-900">
                                <span>Total Payable</span>
                                <span className="text-red-600">{formatPrice(order.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
