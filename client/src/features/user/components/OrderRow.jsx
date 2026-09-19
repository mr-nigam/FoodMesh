import { 
    BiChevronRight,
    BiTimeFive,
    BiStore 
} from "react-icons/bi";

import formatCurrency from "../../../utils/formatCurrency.js";


const statusBadgeStyles = {
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
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return dateString;
    }
};


const OrderRow = ({ 
    order, 
    onClick 
}) => {
    const rawStatus = (order.status || "created").toLowerCase();
    const badgeStyle = statusBadgeStyles[rawStatus] || "bg-gray-100 text-gray-800 border-gray-200";
    const orderId = order.order_id || order.id || "";
    const shortId = orderId ? orderId.slice(-8).toUpperCase() : "ORDER";

    const restaurantNames = Array.isArray(order.restaurants)
        ? order.restaurants.map((r) => r.name || r.restaurant_name).filter(Boolean).join(", ")
        : "";

    return (
        <div 
            onClick={onClick}
            className="group cursor-pointer rounded-2xl bg-white border border-gray-100 p-5 shadow-xs transition hover:shadow-md hover:border-gray-200"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-gray-800">
                            #{shortId}
                        </span>
                        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                            {order.status?.replace(/_/g, " ")}
                        </span>
                    </div>

                    {restaurantNames && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                            <BiStore className="text-gray-400 text-sm shrink-0" />
                            <span className="line-clamp-1">{restaurantNames}</span>
                            {order.restaurant_count > 1 && (
                                <span className="text-[10px] bg-red-50 text-red-600 font-bold px-1.5 py-0.2 rounded-md">
                                    {order.restaurant_count} Restaurants
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <BiTimeFive className="shrink-0" />
                        <span>{formatDate(order.created_at)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
                    <div className="sm:text-right">
                        <p className="text-base font-extrabold text-gray-900">
                            {formatCurrency(order.total_amount)}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium">
                            {order.recipient_name || "Order Details"}
                        </p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-red-50 group-hover:text-red-600 text-gray-400 flex items-center justify-center transition shrink-0">
                        <BiChevronRight className="text-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
};


export default OrderRow;