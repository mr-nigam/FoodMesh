import { 
    useState,
    useEffect,
    useRef
} from "react";

import {
    BiStore,
    BiMapPin,
    BiRupee,
    BiNavigation,
    BiTimeFive,
    BiCheck,
    BiX,
    BiCycling
} from "react-icons/bi";

import { 
    playNotificationChime
} from "../utils/riderAudio.js";


const DeliveryOfferModal = ({
    offer,
    onAccept,
    onDecline,
    onExpired
}) => {
    
    const totalDuration = offer?.windowSeconds || 15;
    const [timeLeft, setTimeLeft] = useState(totalDuration);
    const [accepting, setAccepting] = useState(false);
    const [declining, setDeclining] = useState(false);
    const expiredRef = useRef(false);

    // Initial Chime Alert
    useEffect(() => {
        playNotificationChime();
    }, []);

    // Countdown Timer Loop
    useEffect(() => {
        if(!offer) return;

        // Calculate initial remaining time if expiresAt is provided
        const calcRemaining = () => {
            if (offer.expiresAt) {
                const diff = (new Date(offer.expiresAt).getTime() - Date.now()) / 1000;
                return Math.max(0, Math.min(totalDuration, diff));
            }
            return totalDuration;
        };


        const loadTimeLeft = ()=>{
            setTimeLeft(calcRemaining());
        }

        loadTimeLeft();

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0.2) {
                    clearInterval(interval);
                    if (!expiredRef.current) {
                        expiredRef.current = true;
                        if (onExpired) onExpired(offer);
                    }
                    return 0;
                }
                return prev - 0.2;
            });
        }, 200);

        return () => clearInterval(interval);
    }, [offer, totalDuration, onExpired]);

    if (!offer) return null;

    const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));

    const handleAccept = async () => {
        if (accepting || declining) return;
        setAccepting(true);
        try {
            await onAccept(offer);
        } finally {
            setAccepting(false);
        }
    };

    const handleDecline = async () => {
        if (accepting || declining) return;
        setDeclining(true);
        try {
            await onDecline(offer);
        } finally {
            setDeclining(false);
        }
    };

    const restaurantAddressStr = typeof offer.restaurantAddress === 'string'
        ? offer.restaurantAddress
        : (offer.restaurantAddress?.formattedAddress || offer.restaurantAddress?.addressLine1 || "Store Location");

    const deliveryAddressStr = typeof offer.deliveryAddress === 'string'
        ? offer.deliveryAddress
        : (offer.deliveryAddress?.formattedAddress || offer.deliveryAddress?.addressLine1 || "Customer Location");

    const distanceKm = offer.aerialDistanceMeters
        ? (offer.aerialDistanceMeters / 1000).toFixed(1)
        : "2.4";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-orange-500 overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                
                {/* Header: Pulsing Live Offer Banner */}
                <div className="bg-linear-to-r from-orange-600 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 bg-white/20 rounded-xl text-xl animate-bounce">
                            <BiCycling />
                        </span>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-orange-100 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                Incoming Delivery Offer
                            </span>
                            <h3 className="font-extrabold text-sm text-white">Order #{offer.orderId?.slice(0, 8) || "REQUEST"}</h3>
                        </div>
                    </div>

                    {/* Circular Countdown Badge */}
                    <div className="flex flex-col items-center justify-center bg-black/25 px-3 py-1.5 rounded-2xl border border-white/20">
                        <span className="text-xs text-orange-200 font-semibold flex items-center gap-1">
                            <BiTimeFive /> Time Left
                        </span>
                        <span className={`text-base font-black font-mono ${timeLeft <= 5 ? "text-red-300 animate-pulse" : "text-white"}`}>
                            {Math.ceil(timeLeft)}s
                        </span>
                    </div>
                </div>

                {/* Smooth Progress Bar */}
                <div className="w-full bg-gray-100 h-2 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-200 ${
                            timeLeft <= 5 ? "bg-red-500" : timeLeft <= 10 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Offer Content */}
                <div className="p-6 space-y-5">
                    {/* Payout & Distance Highlight Box */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Guaranteed Payout</p>
                            <h2 className="text-2xl font-black text-emerald-700 flex items-center">
                                <BiRupee />{offer.estimatedEarnings || "65.00"}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Trip Distance</p>
                            <p className="text-lg font-black text-gray-900 flex items-center justify-end gap-1">
                                <BiNavigation className="text-orange-500" /> {distanceKm} km
                            </p>
                        </div>
                    </div>

                    {/* Route Details */}
                    <div className="space-y-4 text-xs">
                        {/* Pickup */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shrink-0 mt-0.5">
                                <BiStore className="text-base" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">Pickup Store</span>
                                <h4 className="font-bold text-gray-900 text-sm truncate">{offer.restaurantName || "Restaurant"}</h4>
                                <p className="text-gray-500 text-[11px] line-clamp-2 mt-0.5">{restaurantAddressStr}</p>
                            </div>
                        </div>

                        {/* Divider Line */}
                        <div className="border-l-2 border-dashed border-gray-200 ml-4.5 h-4" />

                        {/* Drop */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0 mt-0.5">
                                <BiMapPin className="text-base" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Customer Drop</span>
                                <h4 className="font-bold text-gray-900 text-sm truncate">{offer.recipientName || "Customer"}</h4>
                                <p className="text-gray-500 text-[11px] line-clamp-2 mt-0.5">{deliveryAddressStr}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleDecline}
                            disabled={accepting || declining}
                            className="py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <BiX className="text-lg text-gray-500" />
                            Decline
                        </button>

                        <button
                            type="button"
                            onClick={handleAccept}
                            disabled={accepting || declining || timeLeft <= 0}
                            className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {accepting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    <BiCheck className="text-xl" />
                                    Accept ({Math.ceil(timeLeft)}s)
                                </>
                            )}
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};


export default DeliveryOfferModal;