import { 
    useEffect,
    useState,
    useMemo
} from "react";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap
} from "react-leaflet";

import {
    BiArrowBack,
    BiStore,
    BiMapPin,
    BiCheckCircle,
    BiPhoneCall
} from "react-icons/bi";

import { 
    MdDirectionsBike
} from "react-icons/md";

import L from "leaflet";

import useSocket from 
"../../../context/useSocket";


// Custom HTML Markers using Tailwind classes for crisp Leaflet rendering
const createCustomIcon = (emoji, bgColor = "bg-orange-500", ringColor = "ring-orange-200") => {
    return L.divIcon({
        className: "custom-leaflet-marker",
        html: `
            <div class="relative flex items-center justify-center w-10 h-10 rounded-full ${bgColor} text-white shadow-xl ring-4 ${ringColor} transition-transform hover:scale-110">
                <span class="text-base select-none">${emoji}</span>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -22]
    });
};

const riderIcon = createCustomIcon("🚴", "bg-emerald-600", "ring-emerald-200");
const restaurantIcon = createCustomIcon("🏪", "bg-amber-600", "ring-amber-200");
const customerIcon = createCustomIcon("📍", "bg-red-600", "ring-red-200");

// Helper component to auto-fit map view to all active coordinates
const MapBoundsAdjuster = ({ coordinates }) => {
    const map = useMap();

    useEffect(() => {
        const validCoords = coordinates.filter(
            (c) => c && Number.isFinite(c[0]) && Number.isFinite(c[1])
        );
        if (validCoords.length === 0) return;

        if (validCoords.length === 1) {
            map.setView(validCoords[0], 15, { animate: true });
        } else {
            const bounds = L.latLngBounds(validCoords);
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 16,
                animate: true
            });
        }
    }, [map, coordinates]);

    return null;
};

const parseCoords = (obj) => {

    if(!obj) return null;
    const lat = Number(obj.latitude ?? obj.lat ?? obj.drop_latitude ?? obj.pickup_latitude ?? obj.y);
    const lng = Number(obj.longitude ?? obj.lng ?? obj.drop_longitude ?? obj.pickup_longitude ?? obj.x);
    
    if(
        Number.isFinite(lat) && 
        Number.isFinite(lng) && 
        (lat !== 0 || lng !== 0)
    ){
        return { 
            latitude: lat,
            longitude: lng
        };
    }

    return null;
};

const formatAddress = (addr) => {

    if(!addr) return "";
    if(typeof addr === "string") return addr;

    const parts = [
        addr.addressLine1 || addr.address_line1 || addr.street,
        addr.addressLine2 || addr.address_line2,
        addr.city,
        addr.state,
        addr.postalCode || addr.pincode
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : addr.formattedAddress || "";
};

const DELIVERY_STAGES = [
    { key: "rider_assigned", label: "Rider Assigned", desc: "A rider has accepted your order" },
    { key: "picked_up", label: "Food Picked Up", desc: "Rider collected order from restaurant" },
    { key: "on_the_way", label: "On The Way", desc: "Rider is heading to your delivery location" },
    { key: "delivered", label: "Delivered", desc: "Order delivered safely" }
];

const RiderLiveLocation = ({
    orderId,
    restaurantOrderId,
    order,
    selectedRestaurant,
    onBack
}) => {

    const socket = useSocket();

    const [riderLocation, setRiderLocation] = useState(null);
    const [liveStatus, setLiveStatus] = useState(
        (selectedRestaurant?.status || order?.status || "rider_assigned").toLowerCase()
    );

    const [lastPingTime, setLastPingTime] = useState(null);
    const [secondsSinceLastPing, setSecondsSinceLastPing] = useState(0);
    const [isDelivered, setIsDelivered] = useState(liveStatus === "delivered");

    // Extract restaurant coordinates
    const restaurantCoords = useMemo(() => {
        return parseCoords(selectedRestaurant) || parseCoords(selectedRestaurant?.address);
    }, [selectedRestaurant]);

    // Extract customer coordinates
    const customerCoords = useMemo(() => {
        return parseCoords(order?.delivery_address);
    }, [order]);

    // Track elapsed time since last location ping
    useEffect(() => {
    
        if(!lastPingTime) return;
        
        const interval = setInterval(() => {
            setSecondsSinceLastPing(Math.floor((Date.now() - lastPingTime) / 1000));
        }, 1000);
        
        return () => clearInterval(interval);
    
    }, [lastPingTime]);

    // Socket subscription to live tracking
    useEffect(() => {
        if(!socket || !orderId) return;

        const targetId = orderId;

        // 1. Subscribe to order tracking room
        socket.emit("tracking:subscribe", { orderId: targetId });

        // Also subscribe with restaurantOrderId if distinct
        if(
            restaurantOrderId && 
            restaurantOrderId !== orderId
        ){
            socket.emit(
                "tracking:subscribe",
                { 
                    orderId: restaurantOrderId
                }
            );
        }

        // 2. Listen for live coordinate broadcasts
        const handleLocationUpdate = (data) => {
            if (!data || !data.latitude || !data.longitude) return;

            // Ensure event belongs to this order
            if (
                data.orderId === orderId ||
                data.restaurantOrderId === restaurantOrderId ||
                data.orderId === restaurantOrderId
            ) {
                setRiderLocation({
                    latitude: Number(data.latitude),
                    longitude: Number(data.longitude),
                    speed: data.speed,
                    heading: data.heading,
                    accuracy: data.accuracy,
                    freshness: data.freshness,
                    timestamp: data.timestamp || Date.now()
                });
                setLastPingTime(Date.now());
                setSecondsSinceLastPing(0);
            }
        };

        // 3. Listen for delivery lifecycle ending
        const handleTrackingEnded = (data) => {
            if (
                data?.orderId === orderId ||
                data?.restaurantOrderId === restaurantOrderId
            ) {
                setIsDelivered(true);
                setLiveStatus("delivered");
            }
        };

        // 4. Listen for order status updates
        const handleStatusUpdated = (payload) => {
            if (payload?.orderId === orderId || payload?.id === orderId) {
                const nextStatus = (payload.status || "").toLowerCase();
                setLiveStatus(nextStatus);
                if (nextStatus === "delivered") {
                    setIsDelivered(true);
                }
            }
        };

        socket.on("tracking:location", handleLocationUpdate);
        socket.on("tracking:ended", handleTrackingEnded);
        socket.on("order:status_updated", handleStatusUpdated);

        return () => {
            socket.emit("tracking:unsubscribe", { orderId: targetId });
            if (restaurantOrderId && restaurantOrderId !== orderId) {
                socket.emit("tracking:unsubscribe", { orderId: restaurantOrderId });
            }
            socket.off("tracking:location", handleLocationUpdate);
            socket.off("tracking:ended", handleTrackingEnded);
            socket.off("order:status_updated", handleStatusUpdated);
        };
    }, [socket, orderId, restaurantOrderId]);

    // Default map coordinates: rider -> restaurant -> customer -> default
    const defaultCenter = [31.326, 75.5762];

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const riderPos = riderLocation
        ? [riderLocation.latitude, riderLocation.longitude]
        : null;
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const restPos = restaurantCoords
        ? [restaurantCoords.latitude, restaurantCoords.longitude]
        : null;
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const custPos = customerCoords
        ? [customerCoords.latitude, customerCoords.longitude]
        : null;

    const initialCenter = riderPos || restPos || custPos || defaultCenter;
    const allPositions = [riderPos, restPos, custPos].filter(Boolean);

    // Route polyline points
    const routePoints = useMemo(() => {
        if (riderPos && restPos && custPos) {
            return [riderPos, restPos, custPos];
        }
        if (riderPos && custPos) {
            return [riderPos, custPos];
        }
        if (restPos && custPos) {
            return [restPos, custPos];
        }
        return [];
    }, [riderPos, restPos, custPos]);

    // Stepper active index
    const activeStageIndex = useMemo(() => {
        if (isDelivered || liveStatus === "delivered") return 3;
        if (liveStatus === "on_the_way" || liveStatus === "arrived_customer") return 2;
        if (liveStatus === "picked_up") return 1;
        return 0; // rider_assigned / accepted
    }, [liveStatus, isDelivered]);

    return (
        <div className="space-y-6">
            {/* Header Navigation & Live Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                        title="Back to Order Details"
                    >
                        <BiArrowBack className="text-xl" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-black text-gray-900">
                                Live Rider Tracking
                            </h1>
                            {isDelivered ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <BiCheckCircle /> Delivered
                                </span>
                            ) : riderLocation ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Live GPS
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    Connecting...
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Order #{orderId?.slice(0, 8)} • {selectedRestaurant?.name || "Restaurant"}
                        </p>
                    </div>
                </div>

                {/* Live Speed / Ping Indicator */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    {riderLocation && (
                        <div className="text-right">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                Speed
                            </p>
                            <p className="text-sm font-black text-gray-900 font-mono">
                                {riderLocation.speed ? `${Math.round(riderLocation.speed)} km/h` : "In Transit"}
                            </p>
                        </div>
                    )}
                    {lastPingTime && (
                        <div className="text-right border-l border-gray-100 pl-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                Last Update
                            </p>
                            <p className="text-xs font-semibold text-gray-600">
                                {secondsSinceLastPing <= 5 ? "Just now" : `${secondsSinceLastPing}s ago`}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delivery Progress Bar */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
                <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4">
                    {/* Background track line */}
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-100 z-0"></div>

                    {/* Active progress line */}
                    <div
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 z-0"
                        style={{
                            width: `${(activeStageIndex / (DELIVERY_STAGES.length - 1)) * 100}%`
                        }}
                    ></div>

                    {DELIVERY_STAGES.map((stage, idx) => {
                        const isPassed = activeStageIndex >= idx;
                        const isCurrent = activeStageIndex === idx;

                        return (
                            <div key={stage.key} className="flex flex-col items-center relative z-10">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                        isPassed
                                            ? "bg-emerald-500 text-white ring-4 ring-emerald-50"
                                            : "bg-white border-2 border-gray-300 text-gray-400"
                                    } ${isCurrent ? "scale-110 ring-4 ring-emerald-100" : ""}`}
                                >
                                    {isPassed ? <BiCheckCircle className="text-base" /> : idx + 1}
                                </div>
                                <span
                                    className={`text-[11px] font-semibold mt-2 text-center max-w-20 ${
                                        isCurrent ? "text-gray-900 font-bold" : "text-gray-500"
                                    }`}
                                >
                                    {stage.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Map Container */}
            <div className="relative bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="w-full h-112.5 relative z-0">
                    <MapContainer
                        center={initialCenter}
                        zoom={14}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <MapBoundsAdjuster coordinates={allPositions} />

                        {/* Rider Live Marker */}
                        {riderPos && (
                            <Marker position={riderPos} icon={riderIcon}>
                                <Popup>
                                    <div className="text-xs font-sans p-1">
                                        <p className="font-bold text-emerald-700 flex items-center gap-1">
                                            <MdDirectionsBike /> Assigned Rider
                                        </p>
                                        <p className="text-gray-600 mt-1">
                                            Status: {liveStatus.replace(/_/g, " ")}
                                        </p>
                                        {riderLocation?.speed && (
                                            <p className="text-gray-500 font-mono text-[11px]">
                                                Speed: {Math.round(riderLocation.speed)} km/h
                                            </p>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Restaurant Pickup Marker */}
                        {restPos && (
                            <Marker position={restPos} icon={restaurantIcon}>
                                <Popup>
                                    <div className="text-xs font-sans p-1">
                                        <p className="font-bold text-amber-700 flex items-center gap-1">
                                            <BiStore /> Pickup Store
                                        </p>
                                        <p className="font-semibold text-gray-900 mt-1">
                                            {selectedRestaurant?.name || "Restaurant"}
                                        </p>
                                        <p className="text-gray-500 text-[11px]">
                                            {formatAddress(selectedRestaurant?.address)}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Customer Drop-off Marker */}
                        {custPos && (
                            <Marker position={custPos} icon={customerIcon}>
                                <Popup>
                                    <div className="text-xs font-sans p-1">
                                        <p className="font-bold text-red-600 flex items-center gap-1">
                                            <BiMapPin /> Delivery Address
                                        </p>
                                        <p className="font-semibold text-gray-900 mt-1">
                                            {order?.recipient_name || "Customer"}
                                        </p>
                                        <p className="text-gray-500 text-[11px]">
                                            {formatAddress(order?.delivery_address)}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Routing Polyline */}
                        {routePoints.length > 1 && (
                            <Polyline
                                positions={routePoints}
                                color="#10b981"
                                dashArray="6, 8"
                                weight={4}
                                opacity={0.8}
                            />
                        )}
                    </MapContainer>
                </div>

                {/* Floating Map Overlay Info if Rider Position Pending */}
                {!riderLocation && !isDelivered && (
                    <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 z-10 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-gray-200/80 shadow-lg max-w-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 animate-pulse">
                            <MdDirectionsBike className="text-lg" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-900">
                                Waiting for rider's GPS ping...
                            </p>
                            <p className="text-[11px] text-gray-500">
                                Coordinates refresh automatically every 10 seconds.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Delivery Details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Pickup Details */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                    <div className="flex items-center gap-2.5 text-amber-700 font-bold text-sm">
                        <BiStore className="text-lg" />
                        <span>Pickup Location</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">
                            {selectedRestaurant?.name || "Restaurant"}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {formatAddress(selectedRestaurant?.address)}
                        </p>
                    </div>
                    {selectedRestaurant?.phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1.5 pt-1">
                            <BiPhoneCall /> {selectedRestaurant.phone}
                        </p>
                    )}
                </div>

                {/* Delivery Drop-off Details */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                    <div className="flex items-center gap-2.5 text-red-600 font-bold text-sm">
                        <BiMapPin className="text-lg" />
                        <span>Delivery Destination</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">
                            {order?.recipient_name || "Customer"}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {formatAddress(order?.delivery_address)}
                        </p>
                    </div>
                    {order?.recipient_phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1.5 pt-1">
                            <BiPhoneCall /> {order.recipient_phone}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RiderLiveLocation;
