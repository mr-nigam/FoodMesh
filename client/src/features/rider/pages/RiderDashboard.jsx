import { 
    useEffect, 
    useState
} from "react";
import {
    useNavigate,
    Link
} from "react-router-dom";
import toast from "react-hot-toast";
import {
    BiCycling,
    BiCar,
    BiRupee,
    BiMapPin,
    BiPlay,
} from "react-icons/bi";


import useAppData from "../../../context/useAppData.js";
import useSocket from "../../../context/useSocket.js";

import {
    getRiderProfile,
    updateAvailabilityStatus,
    updateRiderLocation,
    getRiderVehicles,
    getRiderMetrics
} from "../services/riderService.js";
import {
    acceptDeliveryOffer,
    rejectDeliveryOffer,
    getActiveDelivery,
    updateDeliveryProgress
} from "../services/deliveryService.js";
import { 
    getCurrentRiderCoords,
    startRiderLocationWatch 
} from "../utils/riderLocation.js";

import RiderNavbar from "../components/RiderNavbar.jsx";
import RiderLiveMap from "../components/RiderLiveMap.jsx";
import ActiveDeliveryCard from "../components/ActiveDeliveryCard.jsx";
import DeliveryOfferModal from "../components/DeliveryOfferModal.jsx";
import RiderEarnings from "../components/RiderEarnings.jsx";
import RiderVehicles from "../components/RiderVehicles.jsx";
import RiderDeliveriesHistory from "../components/RiderDeliveriesHistory.jsx";
import RiderProfile from "../components/RiderProfile.jsx";




const sampleDemoTask = {
    orderId: "ORD-583921",
    restaurantName: "Royal Biryani & Rolls",
    restaurantAddress: "Shop 4, Main Market, Connaught Place, New Delhi",
    restaurantPhone: "+919876543210",
    restaurantCoords: { latitude: 28.6315, longitude: 77.2167 },
    customerName: "Aman Sharma",
    customerAddress: "Flat 402, Green Avenue Apartments, Barakhamba Road, New Delhi",
    customerPhone: "+919811223344",
    customerCoords: { latitude: 28.6289, longitude: 77.2245 },
    items: [
        { name: "Special Chicken Biryani (Family Pack)", quantity: 1 },
        { name: "Butter Naan", quantity: 2 },
        { name: "Gulab Jamun (2 pcs)", quantity: 1 }
    ],
    earnings: 75.0,
    deliveryOtp: "4589"
};


const RiderDashboard = () => {
    const { user, setUser } = useAppData();
    const navigate = useNavigate();

    const socket = useSocket();
    const [profile, setProfile] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [availabilityStatus, setAvailabilityStatus] = useState("offline");
    const [statusLoading, setStatusLoading] = useState(false);
    const [location, setLocation] = useState({ longitude: null, latitude: null, accuracy: null });
    const [gettingLocation, setGettingLocation] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");

    // Incoming Realtime Offer modal state
    const [incomingOffer, setIncomingOffer] = useState(null);

    // Active delivery task state
    const [activeTask, setActiveTask] = useState(null);
    const [taskStep, setTaskStep] = useState("assigned");

    const parseAddressSafe = (val) => {
        if (!val) return {};
        if (typeof val === 'object') return val;
        if (typeof val === 'string') {
            try {
                const parsed = JSON.parse(val);
                if (typeof parsed === 'object' && parsed !== null) return parsed;
                return { formattedAddress: String(parsed), addressLine1: String(parsed) };
            } catch {
                return { formattedAddress: val, addressLine1: val };
            }
        }
        return {};
    };

    const mapDeliveryToTask = (delivery) => {
        if (!delivery) return null;
        const restaurantAddress = parseAddressSafe(delivery.restaurant_address);
        const deliveryAddress = parseAddressSafe(delivery.delivery_address);

        return {
            deliveryId: delivery.id,
            orderId: delivery.order_id,
            restaurantName: delivery.restaurant_name || "Restaurant",
            restaurantAddress: restaurantAddress?.formattedAddress || restaurantAddress?.addressLine1 || "Restaurant Location",
            restaurantPhone: delivery.restaurant_phone || "+919876543210",
            restaurantCoords: {
                latitude: Number(delivery.pickup_latitude || 28.6315),
                longitude: Number(delivery.pickup_longitude || 77.2167)
            },
            customerName: delivery.recipient_name || "Customer",
            customerAddress: deliveryAddress?.formattedAddress || deliveryAddress?.addressLine1 || "Customer Address",
            customerPhone: delivery.recipient_phone || "+919811223344",
            customerCoords: {
                latitude: Number(delivery.drop_latitude || 28.6289),
                longitude: Number(delivery.drop_longitude || 77.2245)
            },
            items: delivery.items || [
                { name: "Order Package", quantity: 1 }
            ],
            earnings: 65.0,
            deliveryOtp: "4589"
        };
    };

    // Initial Data Fetch
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const prof = await getRiderProfile();
            if (!prof) {
                navigate("/rider-registration");
                return;
            }

            setProfile(prof);
            setAvailabilityStatus(prof.availability_status || "offline");

            const [vehList, met, activeDel] = await Promise.all([
                getRiderVehicles().catch(() => []),
                getRiderMetrics().catch(() => null),
                getActiveDelivery().catch(() => null)
            ]);

            setVehicles(Array.isArray(vehList) ? vehList : []);
            setMetrics(met);

            if (activeDel) {
                setActiveTask(mapDeliveryToTask(activeDel));
                setTaskStep(activeDel.status === "assigned" ? "assigned" : activeDel.status);
            }
        } catch (err) {
            console.error("Failed to load rider profile:", err);
            if (err.response?.status === 404 || err.message?.includes("not found")) {
                navigate("/rider-registration");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(user?.role === "rider"){
            const loadDashboardData = async() =>{
              await fetchDashboardData();
            }
            loadDashboardData();
        }else if(user && user.role !== "rider"){
            const loadDashboardData = async() =>{
              setLoading(false);
            }
            loadDashboardData();
        }
    }, [user]);

    // Location Tracking & Synchronization
    useEffect(() => {
        if (!profile?.rider_id) return;

        let watchId = null;

        const initLocation = async () => {
            setGettingLocation(true);
            try {
                const coords = await getCurrentRiderCoords();
                setLocation(coords);

                await updateRiderLocation({
                    longitude: coords.longitude,
                    latitude: coords.latitude
                });
            } catch (err) {
                console.warn("Initial location update error:", err);
            } finally {
                setGettingLocation(false);
            }

            watchId = startRiderLocationWatch(async (newCoords) => {
                setLocation(newCoords);
                try {
                    await updateRiderLocation({
                        riderId: profile.rider_id ?? profile.id,
                        longitude: newCoords.longitude,
                        latitude: newCoords.latitude
                    });
                } catch (e) {
                    console.warn("Background location sync error:", e);
                }
            });
        };

        initLocation();

        return () => {
            if (watchId !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [profile?.rider_id]);

    // Manual location refresh
    const handleRefreshLocation = async () => {
        setGettingLocation(true);
        try {
            const coords = await getCurrentRiderCoords();
            setLocation(coords);
            if (profile?.rider_id) {
                await updateRiderLocation({
                    riderId: profile.rider_id,
                    longitude: coords.longitude,
                    latitude: coords.latitude
                });
            }
            toast.success("GPS location updated successfully!");
        } catch (err) {
            console.error("Failed to refresh location:", err);
            toast.error("Could not acquire accurate GPS coordinates");
        } finally {
            setGettingLocation(false);
        }
    };

    // Toggle Online / Offline
    const handleToggleStatus = async () => {
        if (!profile?.rider_id) return;

        if (availabilityStatus === "busy") {
            return toast.error("Cannot change availability status while busy in an active delivery");
        }

        const newStatus = availabilityStatus === "online" ? "offline" : "online";

        try {
            setStatusLoading(true);
            const updated = await updateAvailabilityStatus({
                availabilityStatus: newStatus
            });

            const resolvedStatus = updated?.availability_status || newStatus;
            setAvailabilityStatus(resolvedStatus);
            setProfile((prev) => ({ ...prev, availability_status: resolvedStatus }));

            if (resolvedStatus === "online") {
                toast.success("You are now ONLINE. Ready for delivery orders!", { icon: "🟢" });
            } else {
                toast("You are now OFFLINE.", { icon: "⚪" });
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            toast.error(`Failed to update status: ${msg}`);
        } finally {
            setStatusLoading(false);
        }
    };

    // Refresh vehicles list
    const handleRefreshVehicles = async () => {
        try {
            const vehList = await getRiderVehicles();
            setVehicles(Array.isArray(vehList) ? vehList : []);
        } catch (err) {
            console.error("Failed to refresh vehicles", err);
        }
    };

    // Realtime Socket Listeners for Delivery Offers
    useEffect(() => {
        if (!socket || !user || user.role !== "rider") return;

        const handleNewOffer = (offerPayload) => {
            console.log("🔔 [Rider Socket] Received incoming delivery offer:", offerPayload);
            if (availabilityStatus === "online") {
                setIncomingOffer(offerPayload);
            }
        };

        const handleOfferExpired = (data) => {
            setIncomingOffer((current) => {
                if (current?.offerId === data?.offerId) return null;
                return current;
            });
        };

        const handleOfferCancelled = (data) => {
            setIncomingOffer((current) => {
                if (current?.offerId === data?.offerId || current?.deliveryId === data?.deliveryId) {
                    toast("Delivery offer was accepted by another rider", { icon: "ℹ️" });
                    return null;
                }
                return current;
            });
        };

        socket.on("delivery:offer:new", handleNewOffer);
        socket.on("delivery:offer:expired", handleOfferExpired);
        socket.on("delivery:offer:cancelled", handleOfferCancelled);

        return () => {
            socket.off("delivery:offer:new", handleNewOffer);
            socket.off("delivery:offer:expired", handleOfferExpired);
            socket.off("delivery:offer:cancelled", handleOfferCancelled);
        };
    }, [socket, user, availabilityStatus]);

    const handleAcceptIncomingOffer = async (offer) => {
        try {
            const res = await acceptDeliveryOffer({ offerId: offer.offerId, deliveryId: offer.deliveryId });
            toast.success("Delivery offer accepted! Head to the restaurant.", { icon: "🎉" });
            setIncomingOffer(null);

            const delivery = res?.delivery || res;
            setActiveTask(mapDeliveryToTask({
                ...delivery,
                restaurant_name: offer.restaurantName,
                restaurant_address: offer.restaurantAddress,
                recipient_name: offer.recipientName,
                recipient_phone: offer.recipientPhone,
                delivery_address: offer.deliveryAddress,
                pickup_latitude: offer.pickupCoords?.latitude,
                pickup_longitude: offer.pickupCoords?.longitude,
                drop_latitude: offer.dropCoords?.latitude,
                drop_longitude: offer.dropCoords?.longitude
            }));
            setTaskStep("assigned");
            setActiveTab("dashboard");
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            toast.error(`Could not accept offer: ${msg}`);
            setIncomingOffer(null);
        }
    };

    const handleDeclineIncomingOffer = async (offer) => {
        try {
            await rejectDeliveryOffer({ offerId: offer.offerId });
        } catch(e) {
            console.log(e);
            // ignore
        }
        setIncomingOffer(null);
    };

    // Handle Active Delivery Step & Completion
    const handleStepChange = async (newStep) => {
        setTaskStep(newStep);

        if (activeTask?.deliveryId) {
            try {
                await updateDeliveryProgress({
                    deliveryId: activeTask.deliveryId,
                    status: newStep
                });
            } catch (err) {
                console.warn("Could not sync step to delivery service:", err.message);
            }
        }

        if (newStep === "delivered") {
            setAvailabilityStatus("online");
        }
    };

    const handleTaskCompleted = () => {
        setTimeout(() => {
            setActiveTask(null);
            setTaskStep("assigned");
            handleRefreshVehicles();
        }, 2000);
    };

    const handleStartDemoTask = () => {
        if (availabilityStatus !== "online") {
            toast("Going ONLINE to accept demo task...", { icon: "🚀" });
            setAvailabilityStatus("online");
        }
        setActiveTask(sampleDemoTask);
        setTaskStep("assigned");
        toast.success("New delivery order assigned!");
    };

    const handleLogout = () => {
        localStorage.clear();
        if(setUser) setUser(null);
        navigate("/login");
    };

    if(user?.role !== "rider"){
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl">
                    <BiCycling />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Rider Portal Access</h2>
                <p className="text-xs text-gray-500 max-w-sm">
                    You are logged in, but not registered as a Rider. Register now to deliver and earn.
                </p>
                <Link
                    to="/rider-registration"
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                    Complete Rider Registration
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 space-y-3">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold">Loading Rider Dashboard...</p>
            </div>
        );
    }

    const primaryVehicle = vehicles.find((v) => v.is_primary) || vehicles[0];

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            {/* Top Navigation */}
            <RiderNavbar
                rider={profile}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onToggleStatus={handleToggleStatus}
                statusLoading={statusLoading}
                currentCoords={location}
                onRefreshLocation={handleRefreshLocation}
                onLogout={handleLogout}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                {/* TAB: DASHBOARD (LIVE DISPATCH & MAP) */}
                {activeTab === "dashboard" && (
                    <div className="space-y-6">
                        {/* Status Alert Banner if Offline */}
                        {availabilityStatus !== "online" && !activeTask && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                                <div className="flex items-center gap-3 text-amber-800 text-xs">
                                    <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                                    <span>
                                        You are currently <strong>OFFLINE</strong>. Switch your status to <strong>ONLINE</strong> in the top bar to receive orders.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleToggleStatus}
                                    disabled={statusLoading}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
                                >
                                    Go Online Now
                                </button>
                            </div>
                        )}

                        {/* Top Quick Status Overview */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Primary Vehicle Quick Card */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl text-2xl">
                                        <BiCar />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Active Ride</span>
                                        <h3 className="font-bold text-gray-900 text-sm capitalize">
                                            {primaryVehicle
                                                ? (primaryVehicle.manufacturer ? `${primaryVehicle.manufacturer} ${primaryVehicle.model || ""}` : (primaryVehicle.model || primaryVehicle.vehicle_type))
                                                : "No Vehicle"}
                                        </h3>
                                        <p className="text-[11px] font-mono text-gray-500">
                                            {primaryVehicle?.registration_number || "No Plate"}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to="/rider/vehicles"
                                    className="text-xs font-bold text-orange-600 hover:underline"
                                >
                                    Manage
                                </Link>
                            </div>

                            {/* Today's Payout */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-2xl">
                                        <BiRupee />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Today's Earnings</span>
                                        <h3 className="font-black text-gray-900 text-lg flex items-center">
                                            <BiRupee />{parseFloat(metrics?.total_earnings || 0).toFixed(2)}
                                        </h3>
                                        <p className="text-[11px] text-emerald-600 font-semibold">
                                            {metrics?.completed_deliveries || 0} Orders Completed
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("earnings")}
                                    className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                                >
                                    View
                                </button>
                            </div>

                            {/* GPS Status */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl text-2xl">
                                        <BiMapPin />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Live GPS Status</span>
                                        <h3 className="font-bold text-gray-900 text-xs truncate max-w-35">
                                            {location?.latitude
                                                ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                                                : "Locating..."}
                                        </h3>
                                        <p className="text-[11px] text-gray-500">
                                            {gettingLocation ? "Acquiring fix..." : "Accurate to 50m"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRefreshLocation}
                                    disabled={gettingLocation}
                                    className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                                >
                                    Sync
                                </button>
                            </div>
                        </div>

                        {/* Active Delivery Flow or Live Map View */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Map */}
                            <div className={activeTask ? "lg:col-span-7 space-y-4" : "lg:col-span-12 space-y-4"}>
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <h3 className="text-sm font-bold text-gray-900">
                                                {activeTask ? "Live Delivery Route & Navigation" : "Live Rider GPS Radar"}
                                            </h3>
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono">
                                            {location?.latitude ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "GPS Pending"}
                                        </span>
                                    </div>

                                    <RiderLiveMap
                                        riderCoords={location}
                                        restaurantCoords={activeTask?.restaurantCoords}
                                        customerCoords={activeTask?.customerCoords}
                                        restaurantName={activeTask?.restaurantName}
                                        customerName={activeTask?.customerName}
                                        height={activeTask ? "440px" : "380px"}
                                    />
                                </div>

                                {/* Order Simulation Trigger for Testing */}
                                {!activeTask && (
                                    <div className="bg-linear-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                                <BiCycling className="text-orange-600 text-lg" />
                                                Ready to test delivery workflow?
                                            </h4>
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                Simulate an incoming order dispatch to test interactive map routing, store pickup checklist, and customer OTP delivery.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleStartDemoTask}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer shrink-0"
                                        >
                                            <BiPlay className="text-base" /> Simulate Order
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Active Task Card */}
                            {activeTask && (
                                <div className="lg:col-span-5">
                                    <ActiveDeliveryCard
                                        task={activeTask}
                                        taskStep={taskStep}
                                        onStepChange={handleStepChange}
                                        onTaskCompleted={handleTaskCompleted}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: DELIVERIES HISTORY */}
                {activeTab === "deliveries" && <RiderDeliveriesHistory />}

                {/* TAB: EARNINGS & METRICS */}
                {activeTab === "earnings" && <RiderEarnings metrics={metrics} rider={profile} />}

                {/* TAB: VEHICLES */}
                {activeTab === "vehicles" && (
                    <RiderVehicles
                        vehicles={vehicles}
                        onRefresh={handleRefreshVehicles}
                        rider={profile}
                    />
                )}

                {/* TAB: PROFILE */}
                {activeTab === "profile" && <RiderProfile rider={profile} />}
            </main>

            {/* Incoming Realtime Delivery Offer Modal (15s Window Batch Dispatch) */}
            {incomingOffer && (
                <DeliveryOfferModal
                    offer={incomingOffer}
                    onAccept={handleAcceptIncomingOffer}
                    onDecline={handleDeclineIncomingOffer}
                    onExpired={() => setIncomingOffer(null)}
                />
            )}
        </div>
    );
};


export default RiderDashboard;