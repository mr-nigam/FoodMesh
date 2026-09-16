import React, { useState } from "react";
import toast from "react-hot-toast";
import {
    BiUser,
    BiEnvelope,
    BiPhone,
    BiCalendar,
    BiCheckShield,
    BiCreditCard,
    BiBell,
    BiSave,
    BiHelpCircle
} from "react-icons/bi";

const RiderProfile = ({ rider }) => {
    const [soundAlerts, setSoundAlerts] = useState(true);
    const [autoAccept, setAutoAccept] = useState(false);
    const [emergencyPhone, setEmergencyPhone] = useState("+919876543210");
    const [upiId, setUpiId] = useState(`${rider?.phone?.replace("+91", "") || "9876543210"}@paytm`);

    const handleSaveSettings = (e) => {
        e.preventDefault();
        toast.success("Rider preferences saved successfully!");
    };

    return (
        <div className="space-y-6">
            {/* Header / Profile Hero */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center gap-5">
                {rider?.profile_picture_url ? (
                    <img
                        src={rider.profile_picture_url}
                        alt={rider.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-orange-400 shadow-sm"
                    />
                ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                        {rider?.name?.charAt(0) || "R"}
                    </div>
                )}
                <div className="text-center sm:text-left space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-xl font-bold text-gray-900">{rider?.name}</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            Active Partner
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">{rider?.email} • {rider?.phone || "No phone linked"}</p>
                    <p className="text-[11px] text-gray-400">
                        Joined FoodMesh: {rider?.created_at ? new Date(rider.created_at).toLocaleDateString() : "Active"}
                    </p>
                </div>
            </div>

            {/* Account Information & Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <BiUser className="text-orange-500 text-xl" /> Personal Information
                    </h3>

                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-500">Full Name</span>
                            <span className="font-bold text-gray-900">{rider?.name}</span>
                        </div>

                        <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-500">Email Address</span>
                            <span className="font-bold text-gray-900">{rider?.email}</span>
                        </div>

                        <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-500">Phone Number</span>
                            <span className="font-bold text-gray-900">{rider?.phone || "Not Shared"}</span>
                        </div>

                        <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-500">Gender</span>
                            <span className="font-bold text-gray-900 capitalize">{rider?.gender || "Not Shared"}</span>
                        </div>

                        <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-500">Date of Birth</span>
                            <span className="font-bold text-gray-900">
                                {rider?.date_of_birth ? new Date(rider.date_of_birth).toLocaleDateString() : "Not Provided"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Settlement & Preferences Form */}
                <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4 text-xs">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <BiCreditCard className="text-orange-500 text-xl" /> Payout & Delivery Settings
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block font-medium text-gray-700 mb-1">Primary UPI ID for Daily Payouts</label>
                            <input
                                type="text"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                placeholder="name@upi"
                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-gray-700 mb-1">Emergency SOS Contact Number</label>
                            <input
                                type="text"
                                value={emergencyPhone}
                                onChange={(e) => setEmergencyPhone(e.target.value)}
                                placeholder="+919876543210"
                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none"
                            />
                        </div>

                        <div className="pt-2 border-t border-gray-100 space-y-3">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                                    <BiBell className="text-orange-500 text-sm" /> Audio chime on incoming order
                                </span>
                                <input
                                    type="checkbox"
                                    checked={soundAlerts}
                                    onChange={(e) => setSoundAlerts(e.target.checked)}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                />
                            </label>

                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-semibold text-gray-700">Auto-accept closest order in 15 seconds</span>
                                <input
                                    type="checkbox"
                                    checked={autoAccept}
                                    onChange={(e) => setAutoAccept(e.target.checked)}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                />
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <BiSave className="text-base" /> Save Preferences
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RiderProfile;
