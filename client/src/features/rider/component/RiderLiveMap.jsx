import { useEffect } from "react";
import { 
    MapContainer, 
    TileLayer, 
    Marker, 
    Popup, 
    Polyline, 
    useMap 
} from "react-leaflet";
import L from "leaflet";


// Custom HTML Markers using Tailwind classes for clean rendering without external asset loading issues
const createCustomIcon = (emoji, bgColor = "bg-orange-500", ringColor = "ring-orange-200") => {
    return L.divIcon({
        className: "custom-leaflet-marker",
        html: `
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${bgColor} text-white shadow-lg ring-4 ${ringColor} transition-transform hover:scale-110">
                <span class="text-sm select-none">${emoji}</span>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
    });
};

const riderIcon = createCustomIcon("🚴", "bg-orange-500", "ring-orange-200");
const restaurantIcon = createCustomIcon("🏪", "bg-amber-600", "ring-amber-200");
const customerIcon = createCustomIcon("📍", "bg-emerald-600", "ring-emerald-200");

// Helper component to auto-recenter and fit all coordinates within view
const MapBoundsAdjuster = ({ coordinates }) => {
    const map = useMap();

    useEffect(() => {
        const validCoords = coordinates.filter((c) => c && c[0] && c[1]);
        if (validCoords.length === 0) return;

        if (validCoords.length === 1) {
            map.setView(validCoords[0], 14, { animate: true });
        } else {
            const bounds = L.latLngBounds(validCoords);
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true });
        }
    }, [map, coordinates]);

    return null;
};

const RiderLiveMap = ({
    riderCoords,
    restaurantCoords,
    customerCoords,
    restaurantName,
    customerName,
    height = "320px"
}) => {
    // Fallback default coordinates if GPS is pending
    const defaultCenter = [28.6139, 77.2090];
    const riderPos = riderCoords?.latitude ? [riderCoords.latitude, riderCoords.longitude] : defaultCenter;
    const restPos = restaurantCoords?.latitude ? [restaurantCoords.latitude, restaurantCoords.longitude] : null;
    const custPos = customerCoords?.latitude ? [customerCoords.latitude, customerCoords.longitude] : null;

    const allPositions = [riderPos, restPos, custPos].filter(Boolean);

    // Build polyline points
    const routePoints = restPos && custPos
        ? [riderPos, restPos, custPos]
        : restPos
            ? [riderPos, restPos]
            : [];

    return (
        <div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-xs relative z-10" style={{ height }}>
            <MapContainer
                center={riderPos}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapBoundsAdjuster coordinates={allPositions} />

                {/* Rider Marker */}
                <Marker position={riderPos} icon={riderIcon}>
                    <Popup>
                        <div className="text-xs font-sans">
                            <p className="font-bold text-orange-600">Your Live GPS Position</p>
                            <p className="text-gray-500">{riderPos[0].toFixed(4)}, {riderPos[1].toFixed(4)}</p>
                        </div>
                    </Popup>
                </Marker>

                {/* Restaurant Pickup Marker */}
                {restPos && (
                    <Marker position={restPos} icon={restaurantIcon}>
                        <Popup>
                            <div className="text-xs font-sans">
                                <p className="font-bold text-amber-700">Pickup Restaurant</p>
                                <p className="font-semibold text-gray-800">{restaurantName || "Restaurant"}</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Customer Drop-off Marker */}
                {custPos && (
                    <Marker position={custPos} icon={customerIcon}>
                        <Popup>
                            <div className="text-xs font-sans">
                                <p className="font-bold text-emerald-700">Delivery Destination</p>
                                <p className="font-semibold text-gray-800">{customerName || "Customer"}</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Routing Line */}
                {routePoints.length > 1 && (
                    <Polyline
                        positions={routePoints}
                        color="#f97316"
                        dashArray="6, 8"
                        weight={4}
                        opacity={0.8}
                    />
                )}
            </MapContainer>
        </div>
    );
};


export default RiderLiveMap;
