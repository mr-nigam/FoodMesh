import { useState } from "react";
import {
    BiRupee,
    BiTrendingUp,
    BiStar,
    BiCheckCircle,
    BiTimeFive,
    BiWallet,
    BiCreditCard,
    BiAward
} from "react-icons/bi";


const RiderEarnings = ({ metrics, rider }) => {
    const [period, setPeriod] = useState("today");

    const totalEarnings = parseFloat(metrics?.total_earnings || 0);
    const completed = metrics?.completed_deliveries || 0;
    const avgRating = parseFloat(metrics?.average_rating || 5.0).toFixed(1);
    const onTime = metrics?.on_time_rate ? `${parseFloat(metrics.on_time_rate).toFixed(0)}%` : "98%";

    // Simulated calculated splits
    const basePay = (totalEarnings * 0.75).toFixed(2);
    const incentives = (totalEarnings * 0.15).toFixed(2);
    const tips = (totalEarnings * 0.10).toFixed(2);

    return (
        <div className="space-y-6">
            {/* Header & Period Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Earnings & Performance Analytics</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Real-time breakdown of your delivery payouts and customer ratings.</p>
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                    {["today", "week", "month"].map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                                period === p
                                    ? "bg-white text-orange-600 font-bold shadow-xs"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-linear-to-br from-orange-500 to-amber-600 text-white p-5 rounded-2xl shadow-md">
                    <div className="flex items-center justify-between opacity-90 text-xs font-semibold">
                        <span>Total Payout</span>
                        <BiWallet className="text-xl" />
                    </div>
                    <h3 className="text-3xl font-black mt-2 flex items-center">
                        <BiRupee />{totalEarnings.toFixed(2)}
                    </h3>
                    <p className="text-[11px] opacity-80 mt-1 flex items-center gap-1">
                        <BiTrendingUp /> +14% vs previous {period}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                    <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
                        <span>Trips Completed</span>
                        <BiCheckCircle className="text-emerald-500 text-xl" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mt-2">{completed}</h3>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% Completion Rate</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                    <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
                        <span>Customer Rating</span>
                        <BiStar className="text-amber-500 text-xl" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mt-2 flex items-center gap-1">
                        {avgRating} <span className="text-amber-400 text-lg">★</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1">Based on recent ratings</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                    <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
                        <span>On-Time Delivery</span>
                        <BiTimeFive className="text-blue-500 text-xl" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mt-2">{onTime}</h3>
                    <p className="text-[11px] text-blue-600 font-semibold mt-1">Avg 18 min per drop</p>
                </div>
            </div>

            {/* Breakdown & Wallet Settlement */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payout Components */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-5">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <BiAward className="text-orange-500 text-xl" /> Payout Breakdown ({period})
                    </h3>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl text-xs">
                            <span className="font-semibold text-gray-700">Base Delivery Fee (Per KM)</span>
                            <span className="font-black text-gray-900">₹{basePay}</span>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl text-xs">
                            <span className="font-semibold text-gray-700">Peak Hour & Weather Surge</span>
                            <span className="font-black text-gray-900">₹{incentives}</span>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl text-xs">
                            <span className="font-semibold text-gray-700">Customer Tips</span>
                            <span className="font-black text-emerald-600">+₹{tips}</span>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-orange-50/80 rounded-xl text-xs border border-orange-100">
                            <span className="font-bold text-orange-900">Total Net Settlement</span>
                            <span className="font-black text-orange-600 text-sm">₹{totalEarnings.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Bank / Wallet Card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <BiCreditCard className="text-orange-500 text-xl" /> Bank & Settlement
                    </h3>

                    <div className="p-4 bg-linear-to-r from-gray-900 to-gray-800 text-white rounded-2xl space-y-3 shadow-md">
                        <div className="flex justify-between text-xs opacity-75">
                            <span>FoodMesh Partner Card</span>
                            <span>UPI Linked</span>
                        </div>
                        <p className="font-mono text-base tracking-wider font-bold">
                            •••• •••• •••• {rider?.aadhar_number?.slice(-4) || "8821"}
                        </p>
                        <div className="flex justify-between text-[11px] opacity-80 pt-1">
                            <span>{rider?.name?.toUpperCase() || "RIDER PARTNER"}</span>
                            <span>Daily Auto-Transfer</span>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-2 pt-2">
                        <div className="flex justify-between">
                            <span>Next Settlement:</span>
                            <span className="font-semibold text-gray-800">Midnight (00:00)</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Transfer Method:</span>
                            <span className="font-semibold text-gray-800">Direct Bank / UPI</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default RiderEarnings;
