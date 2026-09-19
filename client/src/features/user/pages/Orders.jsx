import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import useSocket from "../../../context/useSocket.js";
import OrderRow from '../components/OrderRow';

import {
    getOrders
}  from '../services/userService.js';

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


const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const socket = useSocket();

    const fetchOrders = async () => {
        try {

            const orders = await getOrders();
            setOrders(orders);

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