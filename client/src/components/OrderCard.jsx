import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ORDER_ACTIONS from '../utils/orderFlow.js';
import axios from 'axios';
import { orderService } from '../config/constants.js';
import toast from 'react-hot-toast';
import formatCurrency from '../utils/formatCurrency.js';
import getAuthHeader from '../config/getAuthHeader.js';
import { BiFile } from 'react-icons/bi';


const formatDate = (dateString) => {
    if(!dateString) return "";

    try{
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    }catch{
        return dateString;
    }
};

const statusConfig = {
    created: { bg: "bg-yellow-100", text: "text-yellow-800", label: "New Order" },
    confirmed: { bg: "bg-orange-100", text: "text-orange-800", label: "Confirmed" },
    accepted: { bg: "bg-blue-100", text: "text-blue-800", label: "Accepted" },
    preparing: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Preparing" },
    ready: { bg: "bg-purple-100", text: "text-purple-800", label: "Ready for Pickup" },
    rider_assigned: { bg: "bg-cyan-100", text: "text-cyan-800", label: "Rider Assigned" },
    picked_up: { bg: "bg-teal-100", text: "text-teal-800", label: "Picked Up" },
    on_the_way: { bg: "bg-blue-100", text: "text-blue-800", label: "On The Way" },
    delivered: { bg: "bg-green-100", text: "text-green-800", label: "Delivered" },
    cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
    rejected: { bg: "bg-rose-100", text: "text-rose-800", label: "Rejected" },
    failed: { bg: "bg-red-100", text: "text-red-800", label: "Failed" }
};

const actionLabels = {
    accepted: { text: "Accept Order", style: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    preparing: { text: "Start Preparing", style: "bg-blue-600 hover:bg-blue-700 text-white" },
    ready: { text: "Mark Ready for Pickup", style: "bg-purple-600 hover:bg-purple-700 text-white" },
    rejected: { text: "Reject", style: "bg-rose-600 hover:bg-rose-700 text-white" }
};

const OrderCard = ({
    order,
    restaurantId,
    onStatusUpdate
}) => {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const rawStatus = (order?.status || "created").toLowerCase();
    const currentStatusConfig = statusConfig[rawStatus] || { bg: "bg-gray-100", text: "text-gray-800", label: rawStatus };
    const availableActions = ORDER_ACTIONS[rawStatus] || [];

    const orderId = order.order_id || order.id;
    const shortOrderId = orderId ? `${orderId.substring(0, 8)}...` : "Order";

    const updateStatus = async (nextStatus) => {
        try{
            setLoading(true);

            await axios.patch(
                `${orderService}/restaurant/${orderId}`,
                {
                    status: nextStatus,
                    orderRestaurantId: order.order_restaurant_id,
                    restaurantId: restaurantId || order.restaurant_id
                },
                getAuthHeader()
            );

            toast.success(`Order marked as ${nextStatus}`);
            onStatusUpdate?.();

        }catch(error){

            console.error("Error while updating status:", error);
            const msg = 
                error?.response?.data?.message || 
                "Failed to update order status";

            toast.error(msg);

        }finally{
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between transition hover:shadow-md">
            {/* Card Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-500 font-semibold" title={orderId}>
                                #{shortOrderId}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${currentStatusConfig.bg} ${currentStatusConfig.text}`}>
                                {currentStatusConfig.label}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {formatDate(order.created_at)}
                        </p>
                    </div>

                    <div className="text-right">
                        <span className="text-base font-bold text-gray-900">
                            {formatCurrency(order.total_amount)}
                        </span>
                        <p className="text-xs text-gray-500">
                            {order.total_quantity ? `${order.total_quantity} items` : `${order.item_count || 1} items`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Customer Details & Items Summary */}
            <div className="p-4 space-y-3 flex-1">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-medium text-gray-800">
                        {order.recipient_name || "Guest Customer"}
                    </span>
                </div>

                {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                    <div className="border-t border-gray-50 pt-2">
                        <button
                            type="button"
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center justify-between w-full"
                        >
                            <span>{expanded ? "Hide Item Details" : `View ${order.items.length} Items`}</span>
                            <span>{expanded ? "▲" : "▼"}</span>
                        </button>

                        {expanded && (
                            <div className="mt-2 space-y-1.5 bg-gray-50 rounded-lg p-2.5 text-xs text-gray-700">
                                {order.items.map((item, idx) => (
                                    <div key={item.item_id || idx} className="flex justify-between items-center">
                                        <span>
                                            {item.quantity}x {item.item_name || item.name}
                                        </span>
                                        <span className="font-mono text-gray-600">
                                            {formatCurrency((item.unit_price || 0) * (item.quantity || 1))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Card Actions Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2 justify-between">
                <button
                    type="button"
                    onClick={() => navigate(`/restaurant/orders/${orderId}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-blue-600 transition"
                >
                    <BiFile className="text-sm" /> Full Details
                </button>

                <div className="flex items-center gap-2">
                    {availableActions.length === 0 ? (
                        <span className="text-xs text-gray-500 italic py-1">
                            {rawStatus === "ready" ? "Awaiting Rider Pickup" : "No further actions"}
                        </span>
                    ) : (
                        availableActions.map((act) => {
                            const btnMeta = actionLabels[act] || { text: act, style: "bg-gray-800 hover:bg-gray-900 text-white" };
                            return (
                                <button
                                    key={act}
                                    type="button"
                                    disabled={loading}
                                    onClick={() => updateStatus(act)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${btnMeta.style}`}
                                >
                                    {loading ? "Updating..." : btnMeta.text}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};


export default OrderCard;