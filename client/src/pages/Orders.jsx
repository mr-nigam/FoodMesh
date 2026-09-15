import { useEffect, useState } from "react";
import useSocket from "../context/useSocket";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { orderService } from "../config/constants";
import getAuthHeader from "../config/getAuthHeader";
import formatCurrency from "../utils/formatCurrency";
import { BiChevronRight, BiTimeFive, BiStore } from "react-icons/bi";

const ACTIVE_STATUSES = [
    "created",
    "confirmed",
    "accepted",
    "preparing",
    "ready",
    "rider_assigned",
    "picked_up",
    "on_the_way"
];

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

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const socket = useSocket();

    const fetchOrders = async () => {
        try {
            const { data } = await axios.get(
                orderService,
                getAuthHeader()
            );

            const fetchedOrders =
                data?.data?.orders ?? 
                data?.orders ??
                [];

            setOrders(fetchedOrders);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadOrders = async()=>{
            await fetchOrders();
        }
        
        loadOrders();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const onOrderUpdate = () => {
            fetchOrders();
        };

        socket.on("order:status_updated", onOrderUpdate);
        socket.on("order:new", onOrderUpdate);
        
        return () => {
            socket.off("order:status_updated", onOrderUpdate);
            socket.off("order:new", onOrderUpdate);
        };

    }, [socket]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm font-medium text-gray-500">Loading your orders...</p>
                </div>
            </div>
        );
    }
    
    if (orders.length === 0) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center px-4">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl font-bold">
                    🛍️
                </div>
                <h2 className="text-xl font-bold text-gray-800">No orders found</h2>
                <p className="text-sm text-gray-500 max-w-sm">
                    You haven't placed any food orders yet. Explore nearby restaurants and order your favorite meal!
                </p>
                <button
                    onClick={() => navigate("/")}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium text-sm px-6 py-2.5 rounded-xl shadow-sm transition"
                >
                    Explore Restaurants
                </button>
            </div>
        );
    }

    const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status?.toLowerCase()));
    const completedOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status?.toLowerCase()));

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Order History</h1>
                    <p className="text-xs text-gray-500 mt-1">Track live active deliveries and review past orders</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                    {orders.length} Total {orders.length === 1 ? "Order" : "Orders"}
                </span>
            </div>

            {/* Active Orders Section */}
            {activeOrders.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <h2 className="text-lg font-bold text-gray-900">
                            Active Orders ({activeOrders.length})
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {activeOrders.map((order) => (
                            <OrderRow 
                                key={order?.order_id || order?.id}
                                order={order}
                                onClick={() => navigate(`/orders/${order?.order_id || order?.id}`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Completed Orders Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">
                    Past Orders ({completedOrders.length})
                </h2>
                {completedOrders.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-center text-sm text-gray-500">
                        No past orders found
                    </div>
                ) : (
                    <div className="space-y-3">
                        {completedOrders.map((order) => (
                            <OrderRow 
                                key={order?.order_id || order?.id}
                                order={order}
                                onClick={() => navigate(`/orders/${order?.order_id || order?.id}`)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Orders;

const OrderRow = ({ order, onClick }) => {
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