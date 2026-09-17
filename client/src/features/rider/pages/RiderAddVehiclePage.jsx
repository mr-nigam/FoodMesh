import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
    BiCar,
    BiArrowBack,
    BiPlus
} from "react-icons/bi";
import useAppData from "../../../context/useAppData.js";
import { addRiderVehicle } from "../service/riderService.js";


const RiderAddVehiclePage = () => {
    const { user } = useAppData();
    const navigate = useNavigate();

    const [vehicleType, setVehicleType] = useState("motorcycle");
    const [manufacturer, setManufacturer] = useState("");
    const [model, setModel] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [color, setColor] = useState("");
    const [registrationExpiryDate, setRegistrationExpiryDate] = useState("");
    const [isPrimary, setIsPrimary] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(vehicleType !== "bicycle" && !registrationNumber.trim()){
            return toast.error("Please enter the vehicle registration / license plate number");
        }

        try {
            setLoading(true);
            const vehicleData = {
                vehicleType: vehicleType,
                manufacturer: manufacturer.trim(),
                model: model.trim(),
                color: color.trim(),
                registrationNumber: registrationNumber.trim().toUpperCase(),
                registrationExpiryDate: registrationExpiryDate || null,
                isPrimary
            };

            await addRiderVehicle({
                vehicleData
            });

            toast.success("Vehicle registered successfully!");
            navigate("/rider/vehicles");
            
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            toast.error(`Failed to register vehicle: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== "rider") {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-500 space-y-3">
                <p>You must be registered as a rider to view this page.</p>
                <Link to="/rider-registration" className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold">
                    Register as Rider
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate("/rider/vehicles")}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-orange-600 transition cursor-pointer"
                    >
                        <BiArrowBack className="text-base" /> Back to Vehicles
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-linear-to-r from-orange-500 to-amber-500 px-6 py-6 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xs text-2xl">
                                <BiCar />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Add Delivery Vehicle</h1>
                                <p className="text-orange-100 text-xs mt-0.5">
                                    Register a new motorcycle, scooter, or bicycle to your rider profile.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Vehicle Type <span className="text-orange-600">*</span>
                            </label>
                            <select
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
                            >
                                <option value="motorcycle">Motorcycle / Bike (Petrol / Electric)</option>
                                <option value="scooter">Scooter / Scooty / EV</option>
                                <option value="bicycle">Bicycle / Cycle</option>
                                <option value="car">Car / Four Wheeler</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Manufacturer / Brand
                                </label>
                                <input
                                    type="text"
                                    value={manufacturer}
                                    onChange={(e) => setManufacturer(e.target.value)}
                                    placeholder="e.g. Honda, Hero, Bajaj, TVS, Ather"
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Model Name
                                </label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="e.g. Activa 6G, Splendor, Pulsar"
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    License Plate / Registration No. {vehicleType !== "bicycle" && <span className="text-orange-600">*</span>}
                                </label>
                                <input
                                    type="text"
                                    value={registrationNumber}
                                    onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                                    placeholder="e.g. DL01AB1234"
                                    required={vehicleType !== "bicycle"}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium uppercase font-mono tracking-wider focus:bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
                                />
                                {vehicleType === "bicycle" && (
                                    <p className="text-[10px] text-gray-400 mt-1">Optional for bicycles</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Vehicle Color
                                </label>
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    placeholder="e.g. Black, Red, Silver, Matte Blue"
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Registration / Insurance Expiry Date
                            </label>
                            <input
                                type="date"
                                value={registrationExpiryDate}
                                onChange={(e) => setRegistrationExpiryDate(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
                            />
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <label className="flex items-center gap-3 p-3.5 bg-orange-50/60 rounded-xl border border-orange-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPrimary}
                                    onChange={(e) => setIsPrimary(e.target.checked)}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                                />
                                <div>
                                    <span className="text-xs font-bold text-gray-900 block">
                                        Set as Primary Vehicle
                                    </span>
                                    <span className="text-[11px] text-gray-500 block">
                                        Use this vehicle as default for incoming delivery assignments.
                                    </span>
                                </div>
                            </label>
                        </div>

                        <div className="pt-4 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate("/rider/vehicles")}
                                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-2 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <BiPlus className="text-base" />
                                {loading ? "Adding Vehicle..." : "Save & Register Ride"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RiderAddVehiclePage;
