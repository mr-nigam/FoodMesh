import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import useAppData from "../../../context/useAppData.js";
import {
    BiCar,
    BiPlus,
    BiCheckCircle,
    BiCheckShield,
    BiCalendar,
    BiArrowBack,
    BiStar,
    BiRefresh
} from "react-icons/bi";
import {
    getRiderProfile,
    getRiderVehicles,
    setPrimaryVehicle
} from "../service/riderService.js";


const RiderVehiclesPage = () => {
    const { user } = useAppData();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settingPrimaryId, setSettingPrimaryId] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prof, vehList] = await Promise.all([
                getRiderProfile().catch(() => null),
                getRiderVehicles().catch(() => [])
            ]);
            
            setProfile(prof);
            setVehicles(Array.isArray(vehList) ? vehList : []);

        }catch(err){
            console.error("Failed to load vehicle data", err);
            toast.error("Failed to load vehicles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(user?.role === "rider"){
            const loadData = async()=>{
                await fetchData();
            }

            loadData();
        }
    }, [user]);

    const handleSetPrimary = async (vehicleId) => {
        try {
            setSettingPrimaryId(vehicleId);
            
            await setPrimaryVehicle(vehicleId);

            toast.success("Primary vehicle updated successfully!");
            const vehList = await getRiderVehicles();
            setVehicles(Array.isArray(vehList) ? vehList : []);

        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            toast.error(`Failed to set primary vehicle: ${msg}`);
        } finally {
            setSettingPrimaryId(null);
        }
    };

    if(user?.role !== "rider"){
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
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Top Navigation & Breadcrumb */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate("/rider")}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-orange-600 transition cursor-pointer"
                    >
                        <BiArrowBack className="text-base" /> Back to Dashboard
                    </button>

                    <button
                        type="button"
                        onClick={fetchData}
                        disabled={loading}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 transition cursor-pointer"
                        title="Refresh list"
                    >
                        <BiRefresh className={`text-base ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                </div>

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-gray-900">My Vehicles</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                                {vehicles.length} {vehicles.length === 1 ? "Ride" : "Rides"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Manage your registered delivery vehicles. The primary vehicle will be used for active orders and dispatch.
                        </p>
                    </div>

                    <Link
                        to="/rider/vehicles/add"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                        <BiPlus className="text-lg" /> Add New Vehicle
                    </Link>
                </div>

                {/* Vehicles Grid */}
                {loading ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
                        Loading your registered vehicles...
                    </div>
                ) : vehicles.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                            <BiCar />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">No Vehicles Registered</h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                                You haven't added any delivery rides yet. Add your motorcycle, scooter, or bicycle to start receiving orders.
                            </p>
                        </div>
                        <Link
                            to="/rider/vehicles/add"
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                        >
                            <BiPlus className="text-base" /> Register Your First Vehicle
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {vehicles.map((v) => (
                            <div
                                key={v.id}
                                className={`bg-white rounded-2xl p-6 border transition shadow-sm space-y-5 flex flex-col justify-between ${
                                    v.is_primary
                                        ? "border-orange-400 ring-2 ring-orange-100"
                                        : "border-gray-200/80 hover:border-orange-200"
                                }`}
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3.5">
                                            <div
                                                className={`p-3.5 rounded-2xl text-2xl ${
                                                    v.is_primary
                                                        ? "bg-orange-500 text-white shadow-sm"
                                                        : "bg-orange-50 text-orange-600"
                                                }`}
                                            >
                                                <BiCar />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900 text-base capitalize">
                                                        {v.manufacturer
                                                            ? `${v.manufacturer} ${v.model}`
                                                            : `${v.vehicle_type} Ride`}
                                                    </h3>
                                                    {v.is_primary && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                                                            <BiCheckCircle className="text-xs" /> Primary Ride
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5 font-semibold tracking-wider">
                                                    {v.registration_number || "NO PLATE / BICYCLE"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attributes Grid */}
                                    <div className="pt-3 border-t border-gray-100 text-xs text-gray-600 grid grid-cols-2 gap-3">
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Type</span>
                                            <strong className="capitalize text-gray-900">{v.vehicle_type}</strong>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Color</span>
                                            <strong className="capitalize text-gray-900">{v.color || "Standard"}</strong>
                                        </div>
                                        {v.registration_expiry_date && (
                                            <div className="col-span-2 p-2.5 bg-gray-50 rounded-xl text-gray-700 flex items-center justify-between">
                                                <span className="text-gray-400 text-[10px] uppercase font-semibold flex items-center gap-1">
                                                    <BiCalendar /> RC Expiry
                                                </span>
                                                <strong className="text-gray-900 font-mono">
                                                    {new Date(v.registration_expiry_date).toLocaleDateString()}
                                                </strong>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                    {v.is_primary ? (
                                        <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                                            <BiCheckCircle className="text-base" /> Active for Deliveries
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleSetPrimary(v.id)}
                                            disabled={settingPrimaryId === v.id}
                                            className="w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl border border-orange-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                        >
                                            <BiStar className="text-base" />
                                            {settingPrimaryId === v.id ? "Setting as Primary..." : "Set as Primary Vehicle"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Verification Documents Reference */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <BiCheckShield className="text-orange-500 text-xl" /> Rider Verification Documents
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
                                {profile?.driving_license_number || "DL1420110012345"}
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
                                •••• •••• {profile?.aadhar_number?.slice(-4) || "8821"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiderVehiclesPage;