import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { orderService } from "../config/constants";
import getAuthHeader from "../config/getAuthHeader";
import useSocket from "../context/useSocket";
import useAppData from "../context/useAppData";
import formatCurrency from "../utils/formatCurrency";
import ORDER_ACTIONS from "../utils/orderFlow";
import {
    BiArrowBack,
    BiUser,
    BiPhone,
    BiMapPin,
    BiReceipt,
    BiTimeFive,
    BiPackage,
    BiCheckCircle,
    BiXCircle
} from "react-icons/bi";

const statusColors = {
    created: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", label: "New Order" },
    confirmed: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", label: "Confirmed" },
    accepted: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", label: "Accepted" },
    preparing: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", label: "Preparing" },
    ready: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", label: "Ready for Pickup" },
    rider_assigned: { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-200", label: "Rider Assigned" },
    picked_up: { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200", label: "Picked Up" },
    on_the_way: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", label: "On The Way" },
    delivered: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200", label: "Delivered" },
    cancelled: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", label: "Cancelled" },
    rejected: { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-200", label: "Rejected" },
    failed: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200", label: "Failed" }
};

const actionLabels = {
    accepted: { text: "Accept Order", style: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" },
    preparing: { text: "Start Preparing", style: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" },
    ready: { text: "Mark Ready for Pickup", style: "bg-purple-600 hover:bg-purple-700 text-white shadow-sm" },
    rejected: { text: "Reject Order", style: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm" }
};

const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return dateString;
    }
};

const formatAddress = (addr) => {
    if (!addr) return "Delivery address unavailable";
    if (typeof addr === "string") return addr;
    const parts = [
        addr.street || addr.address_line1 || addr.addressLine1 || addr.house_number,
        addr.area || addr.landmark,
        addr.city,
        addr.state,
        addr.pincode || addr.postal_code || addr.zipcode
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : JSON.stringify(addr);
};

const RestaurantOrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const { user } = useAppData();

    const restaurantId = user?.restaurantId || user?.restaurant?.id;
    console.log("restaurantId: ",restaurantId);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchOrderDetail = useCallback(async () => {
        if(!orderId) return;
        try{

            const { data } = await axios.get(
                `${orderService}/restaurant/${orderId}`,
                getAuthHeader()
            );

            const orderData = 
                data?.data?.order ?? 
                data?.order ?? 
                data?.data ?? null;
                
            setOrder(orderData);

        }catch(error){
            console.error("Failed to load restaurant order detail:", error);
            toast.error(error.response?.data?.message || "Failed to load order details");
        } finally {
            setLoading(false);
        }
        
    }, [orderId, restaurantId]);

    useEffect(() => {
        const loadOrderDetail = async()=>{
            await fetchOrderDetail();
        }
        
        loadOrderDetail();
    }, [fetchOrderDetail]);

    // Realtime sync
    useEffect(() => {
        if (!socket || !restaurantId) return;

        socket.emit("join:restaurant", restaurantId);

        const onOrderUpdate = (payload) => {
            if (!payload || payload.orderId === orderId || payload.id === orderId) {
                fetchOrderDetail();
            }
        };

        socket.on("order:status_updated", onOrderUpdate);

        return () => {
            socket.off("order:status_updated", onOrderUpdate);
            socket.emit("leave:restaurant", restaurantId);
        };
    }, [socket, restaurantId, orderId, fetchOrderDetail]);

    const handleUpdateStatus = async (nextStatus) => {
        try{

            setUpdating(true);
            
            await axios.patch(
                `${orderService}/restaurant/${orderId}`,
                {
                    status: nextStatus,
                    orderRestaurantId: order?.order_restaurant_id,
                    restaurantId: restaurantId || order?.restaurant_id
                },
                getAuthHeader()
            );

            toast.success(`Order marked as ${nextStatus}`);
            await fetchOrderDetail();
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error(error.response?.data?.message || "Failed to update order status");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm font-medium text-gray-500">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
                <BiXCircle className="mx-auto text-5xl text-gray-400" />
                <h2 className="text-2xl font-bold text-gray-800">Order Not Found</h2>
                <p className="text-sm text-gray-500">
                    Could not find order details for your restaurant.
                </p>
                <button
                    onClick={() => navigate("/restaurant")}
                    className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition"
                >
                    <BiArrowBack /> Back to Dashboard
                </button>
            </div>
        );
    }

    const rawStatus = (order.status || "created").toLowerCase();
    const currentStatusConfig = statusColors[rawStatus] || {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200",
        label: rawStatus
    };
    const availableActions = ORDER_ACTIONS[rawStatus] || [];
    const items = order.items || [];

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-8 pb-16">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate("/restaurant")}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
                >
                    <BiArrowBack className="text-lg" /> Back to Dashboard
                </button>

                <div className="flex items-center gap-2">
                    {availableActions.map((act) => {
                        const meta = actionLabels[act] || { text: act, style: "bg-gray-900 text-white" };
                        return (
                            <button
                                key={act}
                                disabled={updating}
                                onClick={() => handleUpdateStatus(act)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 ${meta.style}`}
                            >
                                {updating ? "Updating..." : meta.text}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Order Overview Header Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-mono tracking-tight">
                                Order #{order.order_id || order.id}
                            </h1>
                            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${currentStatusConfig.bg} ${currentStatusConfig.text} ${currentStatusConfig.border}`}>
                                {currentStatusConfig.label}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 pt-1">
                            <BiTimeFive /> Received at {formatDate(order.created_at)}
                        </p>
                    </div>

                    <div className="sm:text-right">
                        <span className="text-xs text-gray-400 uppercase font-semibold">Order Total</span>
                        <p className="text-2xl font-black text-gray-900">
                            {formatCurrency(order.total_amount)}
                        </p>
                    </div>
                </div>

                {/* Workflow Status Tracker / Alert */}
                {rawStatus === "rejected" || rawStatus === "cancelled" ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                        <BiXCircle className="text-2xl text-red-600 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-red-900">
                                Order {rawStatus === "rejected" ? "Rejected" : "Cancelled"}
                            </p>
                            <p className="text-xs text-red-700">
                                No kitchen preparation is required for this order.
                            </p>
                        </div>
                    </div>
                ) : rawStatus === "delivered" ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                        <BiCheckCircle className="text-2xl text-emerald-600 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-emerald-900">Order Completed & Delivered</p>
                            <p className="text-xs text-emerald-700">Customer received this delivery successfully.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-blue-50/70 border border-blue-200/60 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-900">
                                Current Kitchen State
                            </p>
                            <p className="text-sm font-semibold text-blue-800 capitalize">
                                {rawStatus.replace(/_/g, " ")}
                            </p>
                        </div>
                        {availableActions.length > 0 && (
                            <span className="text-xs font-medium text-blue-700 bg-blue-100/80 px-3 py-1.5 rounded-xl">
                                Action Required Above
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Items Ordered Table / Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <BiPackage className="text-blue-600 text-xl" />
                        Items to Prepare ({items.length})
                    </h2>
                    <span className="text-xs text-gray-500 font-semibold">
                        Total Qty: {items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)}
                    </span>
                </div>

                <div className="divide-y divide-gray-50 p-6">
                    {items.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No items found in this order</p>
                    ) : (
                        items.map((item, idx) => (
                            <div
                                key={item.item_id || item.id || idx}
                                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-mono text-xs font-black flex items-center justify-center shrink-0">
                                        {item.quantity}x
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {item.item_name || item.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Unit Price: {formatCurrency(item.unit_price)}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm font-mono font-extrabold text-gray-900">
                                        {formatCurrency((item.unit_price || 0) * (item.quantity || 1))}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Customer & Bill Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <BiUser className="text-blue-600 text-lg" /> Customer & Delivery Details
                    </h3>

                    <div className="space-y-3 pt-2 text-sm text-gray-700">
                        <div className="flex items-start gap-2.5">
                            <BiUser className="text-gray-400 text-lg mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Customer Name</p>
                                <p className="font-semibold text-gray-900">
                                    {order.recipient_name || "Guest Customer"}
                                </p>
                            </div>
                        </div>

                        {order.recipient_phone && (
                            <div className="flex items-start gap-2.5">
                                <BiPhone className="text-gray-400 text-lg mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Phone</p>
                                    <p className="font-semibold text-gray-900">
                                        {order.recipient_phone}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-2.5">
                            <BiMapPin className="text-gray-400 text-lg mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Delivery Destination</p>
                                <p className="font-medium text-gray-700 leading-relaxed">
                                    {formatAddress(order.delivery_address)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Summary Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <BiReceipt className="text-blue-600 text-lg" /> Order Charges
                    </h3>

                    <div className="space-y-2.5 pt-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-medium text-gray-900">
                                {formatCurrency(order.subtotal)}
                            </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                            <span>Delivery Share</span>
                            <span className="font-medium text-gray-900">
                                {formatCurrency(order.delivery_fee)}
                            </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                            <span>Taxes & GST</span>
                            <span className="font-medium text-gray-900">
                                {formatCurrency(order.tax_amount)}
                            </span>
                        </div>

                        {Number(order.discount_amount) > 0 && (
                            <div className="flex justify-between text-emerald-600">
                                <span>Discount</span>
                                <span className="font-medium">
                                    -{formatCurrency(order.discount_amount)}
                                </span>
                            </div>
                        )}

                        <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-base">
                            <span className="font-black text-gray-900">Total Order Amount</span>
                            <span className="font-black text-blue-600 text-lg">
                                {formatCurrency(order.total_amount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default RestaurantOrderDetail;