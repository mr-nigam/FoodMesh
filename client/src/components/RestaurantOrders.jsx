import { useEffect, useRef, useState } from "react";
import useSocket from '../context/useSocket';
import audio from '../assets/aaja.mp3'
import axios from 'axios'; 
import { orderService } from "../config/constants";
import OrderCard from './OrderCard';
import toast from "react-hot-toast";
import getAuthHeader from '../config/getAuthHeader.js'


const ACTIVE_STATUSES = [
    'created',
    'confirmed',
    'accepted',
    'preparing',
    'ready',
    'rider_assigned',
    'picked_up',
    'on_the_way'
];

const RestaurantOrders = ({
    restaurantId
}) => {

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [audioUnlocked, setAudioUnlocked] = useState(false);

    const socket = useSocket();
    const audioRef = useRef();

    useEffect(() => {
        audioRef.current = new Audio(audio);
        audioRef.current.load();
    }, []);

    const unlockedAudio = () => {
        if (audioRef.current) {
            audioRef.current.play()
                .then(() => {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    setAudioUnlocked(true);
                    
                }).catch((error) => {
                    console.error("Failed to unlock audio:", error);
                });
        }
    };

    const fetchOrders = async () => {
        try{
            const { data } = await axios.get(
                `${orderService}/restaurant`,
                getAuthHeader()
            );

            const ordersData = 
                data?.data?.orders ??
                data?.orders ??
                [];

            setOrders(ordersData);
            
        } catch (error) {
            console.error("Failed to fetch restaurant orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        
        const loadOrders = async()=>{
            try{
                await fetchOrders();
            }catch(error){
                toast.error(error.response?.data?.message ||
                    "Failed to fetch orders"
                );
            }
        }

        loadOrders();
        
    }, [restaurantId]);

    useEffect(() => {

        if(!socket || !restaurantId) return;

        socket.emit("join:restaurant", restaurantId);
        
        const onNewOrder = () => {
            
            if(audioUnlocked && audioRef.current){
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch((error) => {
                    console.log("onNewOrder audio play failed:", error);
                });
            }

            fetchOrders();
        };

        const onStatusUpdated = () => {
            fetchOrders();
        };

        socket.on("order:new", onNewOrder);
        socket.on("order:status_updated", onStatusUpdated);

        return () => {
            socket.off("order:new", onNewOrder);
            socket.off("order:status_updated", onStatusUpdated);
            socket.emit("leave:restaurant", restaurantId);
        };

    }, [socket, restaurantId, audioUnlocked]);

    if(loading){
        return (
            <div className="py-8 text-center">
                <p className="text-gray-500">Loading orders...</p>
            </div>
        );
    }
    
    const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    const completedOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));

    return (
        <div className="space-y-6">
            {!audioUnlocked && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <span className="text-2xl">🔔</span>
                        <div>
                            <p className="font-medium text-blue-900">
                                Enable Sound Notifications
                            </p>
                            <p className="text-sm text-blue-700">
                                Get instant audio alerts when new orders arrive
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={unlockedAudio}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                    >
                        Enable Sound
                    </button>
                </div>
            )}

            {/* Active orders */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        Active Orders
                        <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                            {activeOrders.length}
                        </span>
                    </h3>
                </div>
                {activeOrders.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <p className="text-gray-500">No active orders</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeOrders.map((order) => (
                            <OrderCard 
                                key={order.order_restaurant_id || order.order_id} 
                                order={order}
                                restaurantId={restaurantId}
                                onStatusUpdate={fetchOrders}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Completed Orders */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        Completed / Inactive Orders
                        <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                            {completedOrders.length}
                        </span>
                    </h3>
                </div>
                {completedOrders.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <p className="text-gray-500">No completed orders</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedOrders.map((order) => (
                            <OrderCard 
                                key={order.order_restaurant_id || order.order_id} 
                                order={order}
                                restaurantId={restaurantId}
                                onStatusUpdate={fetchOrders}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


export default RestaurantOrders;
