import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    BiArrowBack,
    BiStore,
    BiMapPin,
    BiPhone,
    BiUser,
    BiTimeFive,
    BiCheckCircle,
    BiXCircle,
    BiReceipt,
    BiPackage
} from "react-icons/bi";

import useSocket from "../../../context/useSocket";
import formatCurrency from "../../../utils/formatCurrency";

import {
    getOrder,
    cancelOrder
} from '../services/userService.js';

const STATUS_STEPS = [
    { key: "created", label: "Order Placed" },
    { key: "confirmed", label: "Confirmed" },
    { key: "accepted", label: "Accepted" },
    { key: "preparing", label: "Preparing Food" },
    { key: "ready", label: "Ready for Pickup" },
    { key: "rider_assigned", label: "Rider Assigned" },
    { key: "picked_up", label: "Picked Up" },
    { key: "on_the_way", label: "On The Way" },
    { key: "delivered", label: "Delivered" }
];

const CANCELLABLE_STATUSES = [
    "created",
    "confirmed",
    "placed",
    "pending",
    "accepted"
];

const statusColors = {
    created: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-orange-100 text-orange-800 border-orange-200",
    accepted: "bg-blue-100 text-blue-800 border-blue-200",
    preparing: "bg-indigo-100 text-indigo-800 border-indigo-200",
    ready: "bg-purple-100 text-purple-800 border-purple-200",
    rider_assigned: "bg-cyan-100 text-cyan-800 border-cyan-200",
    picked_up: "bg-teal-100 text-teal-800 border-teal-200",
    on_the_way: "bg-blue-100 text-blue-800 border-blue-200",
    delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    rejected: "bg-rose-100 text-rose-800 border-rose-200",
    failed: "bg-gray-100 text-gray-800 border-gray-200"
};

const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
        const date = new Date(dateString);

        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return dateString;
    }
};

const formatAddress = (addr) => {
    if (!addr) return "No delivery address provided";

    if (typeof addr === "string") return addr;

    const parts = [
        addr.addressLine1 || addr.address_line1 || addr.street || addr.house_number,
        addr.addressLine2 || addr.address_line2,
        addr.landmark || addr.area,
        addr.city,
        addr.state,
        addr.postalCode || addr.pincode || addr.postal_code || addr.zipcode
    ].filter(Boolean);

    return parts.length > 0
        ? parts.join(", ")
        : addr.formattedAddress || JSON.stringify(addr);
};

const UserOrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    const fetchOrderDetail = useCallback(async () => {
        if (!orderId) return;

        try {
            const order = await getOrder({
                orderId
            });

            setOrder(order);
        } catch (error) {
            console.error("Failed to load order detail:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to load order details"
            );
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        const loadOrderDetails = async()=>{
            await fetchOrderDetail();
        }
        
        loadOrderDetails();
    }, [fetchOrderDetail]);

    // Realtime updates
    useEffect(() => {
        if (!socket || !orderId) return;

        const onOrderUpdate = (payload) => {
            if (
                !payload ||
                payload.orderId === orderId ||
                payload.id === orderId
            ) {
                fetchOrderDetail();
            }
        };

        socket.on("order:status_updated", onOrderUpdate);

        return () => {
            socket.off("order:status_updated", onOrderUpdate);
        };
    }, [socket, orderId, fetchOrderDetail]);

    const handleCancelOrder = async () => {
        try {
            setCancelling(true);

            await cancelOrder({
                orderId
            });

            toast.success("Order cancelled successfully");

            setShowCancelDialog(false);

            await fetchOrderDetail();
        } catch (error) {
            console.error("Cancel order error:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to cancel order"
            );
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>

                    <p className="text-sm font-medium text-gray-500">
                        Loading order details...
                    </p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
                <BiXCircle className="mx-auto text-5xl text-gray-400" />

                <h2 className="text-2xl font-bold text-gray-800">
                    Order Not Found
                </h2>

                <p className="text-sm text-gray-500">
                    We couldn't find the requested order. It may have been
                    removed or does not exist.
                </p>

                <button
                    onClick={() => navigate("/orders")}
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition"
                >
                    <BiArrowBack />
                    Back to Orders
                </button>
            </div>
        );
    }

    const currentStatus = (order.status || "created").toLowerCase();

    const isCancelledOrRejected = [
        "cancelled",
        "rejected",
        "failed"
    ].includes(currentStatus);

    const isCancellable = CANCELLABLE_STATUSES.includes(currentStatus);

    const activeStepIndex = STATUS_STEPS.findIndex(
        (step) => step.key === currentStatus
    );

    /*
     * New API structure:
     *
     * order
     *   └── restaurants[]
     *          └── ordered_items[]
     */
    const restaurantsList = Array.isArray(order.restaurants)
        ? order.restaurants
        : [];

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-8 pb-16">

            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate("/orders")}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
                >
                    <BiArrowBack className="text-lg" />
                    Back to My Orders
                </button>

                {isCancellable && (
                    <button
                        onClick={() => setShowCancelDialog(true)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3.5 py-2 rounded-xl border border-red-200 transition"
                    >
                        Cancel Order
                    </button>
                )}
            </div>

            {/* Order Header Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-8 space-y-6">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">

                    <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">

                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-mono tracking-tight">
                                Order #{order.order_id || order.id}
                            </h1>

                            <span
                                className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                                    statusColors[currentStatus] ||
                                    "bg-gray-100 text-gray-800 border-gray-200"
                                }`}
                            >
                                {currentStatus.replace(/_/g, " ")}
                            </span>
                        </div>

                        <p className="text-xs text-gray-500 flex items-center gap-1.5 pt-1">
                            <BiTimeFive />
                            Placed on {formatDate(order.created_at)}
                        </p>
                    </div>

                    <div className="sm:text-right">
                        <span className="text-xs text-gray-400 uppercase font-semibold">
                            Total Paid
                        </span>

                        <p className="text-2xl font-black text-gray-900">
                            {formatCurrency(order.total_amount)}
                        </p>
                    </div>
                </div>

                {/* Status Tracker */}
                {!isCancelledOrRejected ? (
                    <div className="py-2">

                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">
                            Order Status Progression
                        </h3>

                        <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4">

                            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-100 z-0"></div>

                            <div
                                className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 z-0"
                                style={{
                                    width:
                                        activeStepIndex >= 0
                                            ? `${(activeStepIndex / (STATUS_STEPS.length - 1)) * 100}%`
                                            : "0%"
                                }}
                            ></div>

                            {STATUS_STEPS
                                .filter(
                                    (_, idx) =>
                                        idx % 2 === 0 ||
                                        idx === STATUS_STEPS.length - 1
                                )
                                .map((step, idx) => {

                                    const stepIdx = STATUS_STEPS.findIndex(
                                        (s) => s.key === step.key
                                    );

                                    const isPassed =
                                        activeStepIndex >= stepIdx;

                                    const isCurrent =
                                        activeStepIndex === stepIdx;

                                    return (
                                        <div
                                            key={step.key}
                                            className="flex flex-col items-center relative z-10"
                                        >
                                            <div
                                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                                    isPassed
                                                        ? "bg-emerald-500 text-white ring-4 ring-emerald-50"
                                                        : "bg-white border-2 border-gray-300 text-gray-400"
                                                } ${
                                                    isCurrent
                                                        ? "scale-110 ring-4 ring-emerald-100"
                                                        : ""
                                                }`}
                                            >
                                                {isPassed ? (
                                                    <BiCheckCircle className="text-base" />
                                                ) : (
                                                    idx + 1
                                                )}
                                            </div>

                                            <span
                                                className={`text-[11px] font-semibold mt-2 text-center max-w-20 ${
                                                    isCurrent
                                                        ? "text-gray-900 font-bold"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                ) : (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">

                        <BiXCircle className="text-2xl text-red-600 shrink-0" />

                        <div>
                            <p className="text-sm font-bold text-red-900">
                                This order is {currentStatus}
                            </p>

                            <p className="text-xs text-red-700">
                                {currentStatus === "cancelled"
                                    ? "This order was cancelled. Any charged amount will be refunded according to policy."
                                    : "This order was rejected or could not be processed."}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Restaurant-wise Items Breakdown */}
            <div className="space-y-4">

                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <BiPackage className="text-red-500 text-xl" />
                    Items & Restaurant Details
                </h2>

                {restaurantsList.length > 0 ? (

                    restaurantsList.map((rest, restIdx) => {

                        /*
                         * IMPORTANT:
                         *
                         * Backend returns:
                         *
                         * ordered_items: [...]
                         *
                         * NOT:
                         *
                         * items: [...]
                         */
                        const items = Array.isArray(rest.ordered_items)
                            ? rest.ordered_items
                            : [];

                        const restStatus = (
                            rest.status || currentStatus
                        ).toLowerCase();

                        return (
                            <div
                                key={
                                    rest.order_restaurant_id ||
                                    rest.restaurant_id ||
                                    rest.id ||
                                    restIdx
                                }
                                className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden"
                            >

                                {/* Restaurant Header */}
                                <div className="bg-gray-50/75 p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">

                                    <div className="flex items-center gap-3">

                                        <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-red-500 text-xl shadow-xs">
                                            <BiStore />
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-gray-900 text-base">
                                                {rest.name ||
                                                    rest.restaurant_name ||
                                                    "Restaurant"}
                                            </h3>

                                            {rest.address && (
                                                <p className="text-xs text-gray-500">
                                                    {formatAddress(rest.address)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">

                                        <span
                                            className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                                statusColors[restStatus] ||
                                                "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            {restStatus.replace(/_/g, " ")}
                                        </span>
                                    </div>
                                </div>

                                {/* Items from this Restaurant */}
                                <div className="p-5 divide-y divide-gray-50">

                                    {items.length === 0 ? (

                                        <p className="text-xs text-gray-400 py-2">
                                            No item records found
                                        </p>

                                    ) : (

                                        items.map((item, idx) => (

                                            <div
                                                key={
                                                    item.order_item_id ||
                                                    item.id ||
                                                    idx
                                                }
                                                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                                            >

                                                <div className="flex items-center gap-3">

                                                    <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                                        {item.quantity}x
                                                    </span>

                                                    <div>

                                                        <p className="text-sm font-semibold text-gray-800">
                                                            {item.item_name ||
                                                                item.name ||
                                                                "Item"}
                                                        </p>

                                                        <p className="text-xs text-gray-400">
                                                            {formatCurrency(
                                                                item.unit_price
                                                            )}{" "}
                                                            each
                                                        </p>

                                                    </div>
                                                </div>

                                                {/* Use backend subtotal */}
                                                <p className="font-bold text-sm text-gray-900 font-mono">
                                                    {formatCurrency(
                                                        item.subtotal
                                                    )}
                                                </p>

                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })

                ) : (

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6">
                        <p className="text-sm text-gray-400 text-center">
                            No restaurant details found
                        </p>
                    </div>
                )}
            </div>

            {/* Delivery Info and Bill Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Delivery Information Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">

                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <BiMapPin className="text-red-500 text-lg" />
                        Delivery Address
                    </h3>

                    <div className="space-y-3 pt-2 text-sm text-gray-700">

                        <div className="flex items-start gap-2.5">
                            <BiUser className="text-gray-400 text-lg mt-0.5 shrink-0" />

                            <div>
                                <p className="text-xs text-gray-400 font-medium">
                                    Recipient
                                </p>

                                <p className="font-semibold text-gray-800">
                                    {order.recipient_name || "Customer"}
                                </p>
                            </div>
                        </div>

                        {order.recipient_phone && (
                            <div className="flex items-start gap-2.5">

                                <BiPhone className="text-gray-400 text-lg mt-0.5 shrink-0" />

                                <div>
                                    <p className="text-xs text-gray-400 font-medium">
                                        Contact Number
                                    </p>

                                    <p className="font-semibold text-gray-800">
                                        {order.recipient_phone}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-2.5">

                            <BiMapPin className="text-gray-400 text-lg mt-0.5 shrink-0" />

                            <div>
                                <p className="text-xs text-gray-400 font-medium">
                                    Delivering To
                                </p>

                                <p className="font-medium text-gray-700 leading-relaxed">
                                    {formatAddress(order.delivery_address)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bill Summary Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">

                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <BiReceipt className="text-red-500 text-lg" />
                        Bill Breakdown
                    </h3>

                    <div className="space-y-2.5 pt-2 text-sm">

                        <div className="flex justify-between text-gray-600">
                            <span>Item Subtotal</span>

                            <span className="font-medium text-gray-900">
                                {formatCurrency(order.subtotal)}
                            </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                            <span>Delivery Partner Fee</span>

                            <span className="font-medium text-gray-900">
                                {formatCurrency(order.delivery_fee)}
                            </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                            <span>Taxes & Restaurant Charges</span>

                            <span className="font-medium text-gray-900">
                                {formatCurrency(order.tax_amount)}
                            </span>
                        </div>

                        {Number(order.discount_amount) > 0 && (
                            <div className="flex justify-between text-emerald-600">

                                <span>Discount Applied</span>

                                <span className="font-medium">
                                    -{formatCurrency(order.discount_amount)}
                                </span>
                            </div>
                        )}

                        <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-base">

                            <span className="font-black text-gray-900">
                                Total Paid
                            </span>

                            <span className="font-black text-red-600 text-lg">
                                {formatCurrency(order.total_amount)}
                            </span>

                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelDialog && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">

                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl animate-scaleIn">

                        <h3 className="text-lg font-black text-gray-900">
                            Cancel this Order?
                        </h3>

                        <p className="text-sm text-gray-500 leading-relaxed">
                            Are you sure you want to cancel Order #
                            {order.order_id || order.id}? This action cannot
                            be undone.
                        </p>

                        <div className="flex justify-end gap-3 pt-2">

                            <button
                                disabled={cancelling}
                                onClick={() =>
                                    setShowCancelDialog(false)
                                }
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
                            >
                                Keep Order
                            </button>

                            <button
                                disabled={cancelling}
                                onClick={handleCancelOrder}
                                className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition disabled:opacity-50"
                            >
                                {cancelling
                                    ? "Cancelling..."
                                    : "Yes, Cancel Order"}
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserOrderDetail;