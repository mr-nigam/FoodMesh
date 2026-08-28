import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BiSearch, BiTargetLock, BiX, BiCheckCircle } from 'react-icons/bi';
import toast from 'react-hot-toast';

// Fix default Leaflet icon marker URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to handle map clicks & center changes
const MapEvents = ({ onLocationSelect, position, setMapInstance }) => {
    const map = useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    useEffect(() => {
        if (map) {
            setMapInstance(map);
        }
    }, [map, setMapInstance]);

    useEffect(() => {
        if (position && map) {
            map.flyTo(position, 16, { duration: 1.5 });
        }
    }, [position, map]);

    return position ? <Marker position={position} /> : null;
};

const LocationPickerModal = ({ isOpen, onClose, onSelectLocation, initialLat, initialLng }) => {
    const defaultCenter = [28.6139, 77.2090]; // New Delhi default
    const [position, setPosition] = useState(
        initialLat && initialLng ? [Number(initialLat), Number(initialLng)] : defaultCenter
    );
    const [mapInstance, setMapInstance] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [geocoding, setGeocoding] = useState(false);

    const [locationDetails, setLocationDetails] = useState({
        lat: position[0],
        lng: position[1],
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        countryCode: 'IN',
        formattedAddress: ''
    });

    useEffect(() => {
        if (initialLat && initialLng) {
            const coords = [Number(initialLat), Number(initialLng)];
            setPosition(coords);
            reverseGeocode(coords[0], coords[1]);
        } else {
            // Reverse geocode default center
            reverseGeocode(defaultCenter[0], defaultCenter[1]);
        }
    }, [initialLat, initialLng]);

    // Reverse geocoding via Nominatim OpenStreetMap API
    const reverseGeocode = async (lat, lng) => {
        setGeocoding(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            );
            const data = await res.json();

            if (data && data.address) {
                const addr = data.address;
                const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
                const state = addr.state || addr.region || '';
                const postalCode = addr.postcode || '';
                const countryCode = (addr.country_code || 'in').toUpperCase();
                const addressLine1 = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ') || data.display_name.split(',')[0] || '';

                setLocationDetails({
                    lat: Number(lat.toFixed(6)),
                    lng: Number(lng.toFixed(6)),
                    addressLine1,
                    city,
                    state,
                    postalCode,
                    countryCode,
                    formattedAddress: data.display_name || ''
                });
            } else {
                setLocationDetails(prev => ({
                    ...prev,
                    lat: Number(lat.toFixed(6)),
                    lng: Number(lng.toFixed(6)),
                    formattedAddress: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
                }));
            }
        } catch (error) {
            console.error('Reverse geocode error:', error);
            setLocationDetails(prev => ({
                ...prev,
                lat: Number(lat.toFixed(6)),
                lng: Number(lng.toFixed(6))
            }));
        } finally {
            setGeocoding(false);
        }
    };

    const handleLocationSelect = (lat, lng) => {
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
    };

    // Forward geocoding (search location by query string)
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&limit=1`
            );
            const data = await res.json();

            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                setPosition([lat, lon]);
                reverseGeocode(lat, lon);
                toast.success(`Found: ${result.display_name.split(',')[0]}`);
            } else {
                toast.error('Location not found. Try a different landmark or area.');
            }
        } catch (error) {
            console.error('Search location error:', error);
            toast.error('Failed to search location.');
        } finally {
            setSearching(false);
        }
    };

    // Get live GPS location
    const handleGetLiveLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser.');
            return;
        }

        toast.loading('Fetching live location...', { id: 'gps-loading' });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setPosition([lat, lng]);
                reverseGeocode(lat, lng);
                toast.success('Live location updated!', { id: 'gps-loading' });
            },
            (err) => {
                console.error('GPS error:', err);
                toast.error('Unable to fetch live GPS location.', { id: 'gps-loading' });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleConfirm = () => {
        onSelectLocation(locationDetails);
        toast.success('Location updated!');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
            <div className="flex flex-col h-[90vh] w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            🗺️ Pick Location on Map
                        </h2>
                        <p className="text-xs text-gray-500">
                            Search an address or click anywhere on the map to place the delivery pin
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
                    >
                        <BiX className="h-6 w-6" />
                    </button>
                </div>

                {/* Search Bar & GPS Controls */}
                <div className="p-4 border-b bg-white flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search city, area, landmark (e.g. CP Delhi, Noida Sector 62)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-red-500 focus:outline-hidden focus:ring-2 focus:ring-red-100"
                            />
                            <BiSearch className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        <button
                            type="submit"
                            disabled={searching}
                            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition disabled:opacity-50"
                        >
                            {searching ? 'Searching...' : 'Search'}
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={handleGetLiveLocation}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
                    >
                        <BiTargetLock className="h-5 w-5" />
                        My Live Location
                    </button>
                </div>

                {/* Map View */}
                <div className="relative flex-1 bg-gray-100">
                    <MapContainer
                        center={position}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapEvents
                            onLocationSelect={handleLocationSelect}
                            position={position}
                            setMapInstance={setMapInstance}
                        />
                    </MapContainer>

                    {geocoding && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-white/90 px-4 py-1.5 shadow-md text-xs font-semibold text-gray-700 backdrop-blur-xs flex items-center gap-2">
                            <span className="animate-spin">⏳</span> Resolving address...
                        </div>
                    )}
                </div>

                {/* Selected Location Summary & Confirm */}
                <div className="border-t bg-gray-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Selected Location
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                            {locationDetails.formattedAddress || 'Click anywhere on the map'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Lat: <span className="font-mono text-gray-800">{locationDetails.lat}</span>, Lng: <span className="font-mono text-gray-800">{locationDetails.lng}</span>
                            {locationDetails.city && ` • ${locationDetails.city}`}
                            {locationDetails.state && `, ${locationDetails.state}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-red-700 transition"
                        >
                            <BiCheckCircle className="h-5 w-5" />
                            Confirm Location
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LocationPickerModal;
