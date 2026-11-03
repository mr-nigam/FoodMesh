import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { BiArrowBack, BiXCircle } from "react-icons/bi";
import RiderLiveLocation from "../components/riderLiveLocation.jsx";
import { getOrder } from "../services/userService.js";

const RiderTrackingPage = () => {
    const { orderId, restaurantOrderId: paramRestOrderId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const queryRestOrderId = searchParams.get("restaurantOrderId");
    const restaurantOrderId = paramRestOrderId || queryRestOrderId;

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetail = useCallback(async () => {
        if (!orderId) return;

        try {
            const data = await getOrder({ orderId });
            setOrder(data);
        } catch (error) {
            console.error("Failed to load order for tracking:", error);
            toast.error(
                error.response?.data?.message || "Failed to load order details for tracking"
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

    const selectedRestaurant = useMemo(() => {
        if (!order?.restaurants || !Array.isArray(order.restaurants)) return null;
        if (restaurantOrderId) {
            return (
                order.restaurants.find(
                    (r) =>
                        r.restaurant_order_id === restaurantOrderId ||
                        r.id === restaurantOrderId
                ) || order.restaurants[0]
            );
        }
        return order.restaurants[0];
    }, [order, restaurantOrderId]);

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm font-medium text-gray-500">
                        Initializing Live Delivery Tracking...
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
                    Unable to find this order for tracking.
                </p>
                <button
                    onClick={() => navigate("/orders")}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                    <BiArrowBack />
                    Back to Orders
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-8 pb-16">
            <RiderLiveLocation
                orderId={orderId}
                restaurantOrderId={restaurantOrderId}
                order={order}
                selectedRestaurant={selectedRestaurant}
                onBack={() => navigate(`/orders/${orderId}`)}
            />
        </div>
    );
};


export default RiderTrackingPage;