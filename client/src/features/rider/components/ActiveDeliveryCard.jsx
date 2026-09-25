import { useState } from "react";
import toast from "react-hot-toast";
import {
    BiStore,
    BiUser,
    BiPhone,
    BiNavigation,
    BiRupee,
    BiCheckShield
} from "react-icons/bi";


const ActiveDeliveryCard = ({
    task,
    taskStep,
    onStepChange,
    onTaskCompleted
}) => {
    const [checkedItems, setCheckedItems] = useState({});
    const [otp, setOtp] = useState("");
    const [otpError, setOtpError] = useState(false);

    if (!task) return null;

    const toggleCheckItem = (idx) => {
        setCheckedItems((prev) => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const handleNextStep = () => {
        if(taskStep === "assigned"){
            onStepChange("arrived_restaurant");
            toast.success("Status updated: Arrived at restaurant");

        }else if (taskStep === "arrived_restaurant"){
            const allChecked = task.items?.every((_, idx) => checkedItems[idx]);
            if (task.items?.length > 0 && !allChecked) {
                toast("Please verify all items in the bag before leaving!", { icon: "⚠️" });
            }
            onStepChange("picked_up");
            toast.success("Order picked up. Heading to customer.");

        }else if (taskStep === "picked_up"){
            onStepChange("arrived_customer");
            toast.success("Arrived at customer location");

        }else if (taskStep === "arrived_customer"){
            if(task.deliveryOtp && otp.trim() !== String(task.deliveryOtp).trim()) {
                setOtpError(true);
                toast.error("Invalid Delivery OTP. Ask customer for the 4-digit code.");
                return;
            }
            setOtpError(false);
            onStepChange("delivered");
            toast.success("Delivery completed! Payment added to your wallet.");
            if (onTaskCompleted) {
                onTaskCompleted(task);
            }
        }
    };

    const openNavigation = (coords, address) => {
        const dest = coords?.latitude
            ? `${coords.latitude},${coords.longitude}`
            : encodeURIComponent(address);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank");
    };

    return (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-md p-5 sm:p-6 space-y-6">
            {/* Header / Payout Bar */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <span className="text-[11px] font-extrabold text-orange-600 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        Active Delivery Order
                    </span>
                    <h2 className="text-xl font-black text-gray-900 mt-0.5">{task.orderId}</h2>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">Estimated Payout</p>
                    <p className="text-xl font-extrabold text-emerald-600 flex items-center justify-end">
                        <BiRupee />{task.earnings || "65.00"}
                    </p>
                </div>
            </div>

            {/* Stepper Timeline */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] font-bold">
                <div className={`p-2 rounded-xl transition ${taskStep === "assigned" ? "bg-orange-500 text-white shadow-xs" : "bg-emerald-50 text-emerald-700"}`}>
                    1. At Store
                </div>
                <div className={`p-2 rounded-xl transition ${taskStep === "arrived_restaurant" ? "bg-orange-500 text-white shadow-xs" : taskStep === "picked_up" || taskStep === "arrived_customer" || taskStep === "delivered" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                    2. Pickup
                </div>
                <div className={`p-2 rounded-xl transition ${taskStep === "picked_up" || taskStep === "arrived_customer" ? "bg-orange-500 text-white shadow-xs" : taskStep === "delivered" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                    3. On Way
                </div>
                <div className={`p-2 rounded-xl transition ${taskStep === "delivered" ? "bg-emerald-600 text-white shadow-xs" : "bg-gray-100 text-gray-400"}`}>
                    4. Done
                </div>
            </div>

            {/* Step-Specific Focus Card */}
            {(taskStep === "assigned" || taskStep === "arrived_restaurant") && (
                <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100 space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-orange-500 text-white rounded-xl shadow-xs">
                                <BiStore className="text-xl" />
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold text-orange-700 uppercase tracking-wide">Pickup From</span>
                                <h3 className="text-base font-bold text-gray-900">{task.restaurantName}</h3>
                                <p className="text-xs text-gray-600 mt-0.5">{task.restaurantAddress}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-orange-100/80">
                        <button
                            type="button"
                            onClick={() => openNavigation(task.restaurantCoords, task.restaurantAddress)}
                            className="flex-1 py-2 px-3 bg-white hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl border border-orange-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <BiNavigation className="text-sm" /> Directions to Restaurant
                        </button>
                        {task.restaurantPhone && (
                            <a
                                href={`tel:${task.restaurantPhone}`}
                                className="py-2 px-3 bg-white hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl border border-orange-200 transition flex items-center justify-center gap-1.5"
                            >
                                <BiPhone className="text-sm" /> Call
                            </a>
                        )}
                    </div>
                </div>
            )}

            {(taskStep === "picked_up" || taskStep === "arrived_customer" || taskStep === "delivered") && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                                <BiUser className="text-xl" />
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide">Deliver To</span>
                                <h3 className="text-base font-bold text-gray-900">{task.customerName}</h3>
                                <p className="text-xs text-gray-600 mt-0.5">{task.customerAddress}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-100/80">
                        <button
                            type="button"
                            onClick={() => openNavigation(task.customerCoords, task.customerAddress)}
                            className="flex-1 py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <BiNavigation className="text-sm" /> Directions to Customer
                        </button>
                        {task.customerPhone && (
                            <a
                                href={`tel:${task.customerPhone}`}
                                className="py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center justify-center gap-1.5"
                            >
                                <BiPhone className="text-sm" /> Call Customer
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Order Items Checklist */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                        <BiCheckShield className="text-orange-500 text-sm" />
                        Order Package Checklist ({task.items?.length || 0} items)
                    </h4>
                    <span className="text-[10px] text-gray-400">Check to verify</span>
                </div>

                <div className="space-y-2">
                    {task.items?.map((item, idx) => (
                        <label
                            key={idx}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                                checkedItems[idx]
                                    ? "bg-white border-emerald-300 text-emerald-900 font-semibold"
                                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={Boolean(checkedItems[idx])}
                                    onChange={() => toggleCheckItem(idx)}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                                />
                                <span>{item.name}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-gray-100 rounded-md font-bold text-gray-800">
                                x{item.quantity}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* OTP Verification on Delivery Step */}
            {taskStep === "arrived_customer" && (
                <div className="p-5 bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-orange-400 space-y-3">
                    <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
                        <BiCheckShield className="text-lg" /> Customer Delivery OTP Verification
                    </div>
                    <p className="text-xs text-gray-600">
                        Ask the customer for the 4-digit secret delivery code (Demo Code: <strong>{task.deliveryOtp || "4589"}</strong>).
                    </p>
                    <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                            setOtp(e.target.value);
                            setOtpError(false);
                        }}
                        placeholder="••••"
                        className={`w-full py-3 px-4 bg-white border rounded-xl text-center font-mono text-2xl font-black tracking-widest focus:outline-none ${
                            otpError ? "border-red-500 ring-2 ring-red-200" : "border-orange-300 focus:ring-2 focus:ring-orange-400"
                        }`}
                    />
                </div>
            )}

            {/* Action CTA Button */}
            <button
                type="button"
                onClick={handleNextStep}
                disabled={taskStep === "delivered"}
                className={`w-full py-4 text-white font-black text-sm tracking-wide rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ${
                    taskStep === "delivered"
                        ? "bg-emerald-600"
                        : "bg-orange-600 hover:bg-orange-700 active:scale-[0.99]"
                }`}
            >
                {taskStep === "assigned" && "📍 Mark: Arrived at Restaurant"}
                {taskStep === "arrived_restaurant" && "📦 Confirm Order Picked Up & Start Ride"}
                {taskStep === "picked_up" && "🏠 Mark: Arrived at Customer Location"}
                {taskStep === "arrived_customer" && "✅ Verify OTP & Complete Delivery"}
                {taskStep === "delivered" && "🎉 Delivery Completed Successfully!"}
            </button>
        </div>
    );
};


export default ActiveDeliveryCard;