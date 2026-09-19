import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    BiCar,
    BiPlus,
    BiCheckCircle,
    BiCheckShield,
    BiCalendar,
    BiStar,
    BiLinkExternal
} from "react-icons/bi";
import { addRiderVehicle, setPrimaryVehicle } from "../services/riderService.js";


const RiderVehicles = ({ vehicles = [], onRefresh, rider }) => {
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const [vehicleType, setVehicleType] = useState("motorcycle");
    const [manufacturer, setManufacturer] = useState("");
    const [model, setModel] = useState("");
    const [color, setColor] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [registrationExpiryDate, setRegistrationExpiryDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [settingPrimaryId, setSettingPrimaryId] = useState(null);

    const handleAddVehicle = async (e) => {
        e.preventDefault();

        if (!registrationNumber.trim() && vehicleType !== "bicycle") {
            return toast.error("Please enter the registration number");
        }

        try{
            if(loading){
                return;
            }
            
            setLoading(true);
            await addRiderVehicle({
                vehicleType,
                manufacturer: manufacturer.trim(),
                model: model.trim(),
                color: color.trim(),
                registrationNumber: registrationNumber.trim().toUpperCase(),
                registrationExpiryDate: registrationExpiryDate || null,
                isPrimary: vehicles.length === 0
            });

            toast.success("New vehicle added successfully!");
            setModalOpen(false);
            setManufacturer("");
            setModel("");
            setColor("");
            setRegistrationNumber("");
            setRegistrationExpiryDate("");
            if (onRefresh) onRefresh();
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            toast.error(`Failed to add vehicle: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSetPrimary = async (vehicleId) => {
        try {
            setSettingPrimaryId(vehicleId);
            await setPrimaryVehicle(vehicleId);
            toast.success("Primary vehicle updated successfully!");
            if (onRefresh) onRefresh();
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            toast.error(`Failed to set primary vehicle: ${msg}`);
        } finally {
            setSettingPrimaryId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Vehicles & Verification Documents</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Manage your active delivery rides, number plates, and driving licenses.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to="/rider/vehicles"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                        <BiLinkExternal className="text-sm" /> Full Vehicles Page
                    </Link>
                    <Link
                        to="/rider/vehicles/add"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                    >
                        <BiPlus className="text-base" /> Add New Ride
                    </Link>
                </div>
            </div>

            {/* Vehicle List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.length > 0 ? (
                    vehicles.map((v) => (
                        <div
                            key={v.id}
                            className={`p-5 rounded-2xl border transition shadow-xs space-y-4 flex flex-col justify-between ${
                                v.is_primary ? "bg-white border-orange-300 ring-2 ring-orange-100" : "bg-white border-gray-100"
                            }`}
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl text-2xl">
                                            <BiCar />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900 text-sm capitalize">
                                                    {v.manufacturer ? `${v.manufacturer} ${v.model}` : `${v.vehicle_type} Ride`}
                                                </h3>
                                                {v.is_primary && (
                                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1">
                                                        <BiCheckCircle /> Primary
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                                                {v.registration_number || "No Plate / Bicycle"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 text-xs text-gray-600 grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-gray-400">Type:</span>{" "}
                                        <strong className="capitalize text-gray-800">{v.vehicle_type}</strong>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Color:</span>{" "}
                                        <strong className="capitalize text-gray-800">{v.color || "Standard"}</strong>
                                    </div>
                                    {v.registration_expiry_date && (
                                        <div className="col-span-2 text-[11px] text-gray-500 flex items-center gap-1">
                                            <BiCalendar className="text-xs" /> Fitness Expiry: {new Date(v.registration_expiry_date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Set as Primary Button */}
                            {!v.is_primary && (
                                <div className="pt-2 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => handleSetPrimary(v.id)}
                                        disabled={settingPrimaryId === v.id}
                                        className="w-full py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl border border-orange-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        <BiStar className="text-sm" />
                                        {settingPrimaryId === v.id ? "Updating..." : "Set as Primary"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 p-8 bg-white rounded-2xl border border-gray-100 text-center text-xs text-gray-400 space-y-3">
                        <p>No registered vehicles found. Add your motorcycle or scooter to get started.</p>
                        <Link
                            to="/rider/vehicles/add"
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold"
                        >
                            <BiPlus /> Add Vehicle
                        </Link>
                    </div>
                )}
            </div>

            {/* Document Verification Cards */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <BiCheckShield className="text-orange-500 text-xl" /> KYC & Government IDs
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70 space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-700">Driving License</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                Verified
                            </span>
                        </div>
                        <p className="font-mono text-sm font-bold text-gray-900">
                            {rider?.driving_license_number || "DL1420110012345"}
                        </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70 space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-700">Aadhar Card</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                Verified
                            </span>
                        </div>
                        <p className="font-mono text-sm font-bold text-gray-900">
                            •••• •••• {rider?.aadhar_number?.slice(-4) || "8821"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default RiderVehicles;
