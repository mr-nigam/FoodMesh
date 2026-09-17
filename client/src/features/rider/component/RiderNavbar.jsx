import {
    BiCycling,
    BiPowerOff,
    BiMapPin,
    BiPackage,
    BiRupee,
    BiCar,
    BiUser,
    BiLogOut,
    BiRefresh
} from "react-icons/bi";


const RiderNavbar = ({
    rider,
    activeTab,
    onTabChange,
    onToggleStatus,
    statusLoading,
    currentCoords,
    onRefreshLocation,
    onLogout
}) => {

    const isOnline = rider?.availability_status === "online";

    const navItems = [
        { id: "dashboard", label: "Live Dispatch", icon: BiCycling },
        { id: "deliveries", label: "My Deliveries", icon: BiPackage },
        { id: "earnings", label: "Earnings & Stats", icon: BiRupee },
        { id: "vehicles", label: "Vehicles", icon: BiCar },
        { id: "profile", label: "Profile", icon: BiUser },
    ];

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
            {/* Main Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Branding & Rider Info */}
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-linear-to-tr from-orange-500 to-amber-500 text-white rounded-2xl shadow-sm">
                            <BiCycling className="text-2xl" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold text-gray-900 text-base leading-none">
                                    {rider?.name || "Rider Partner"}
                                </h1>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Verified
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1 font-mono text-[11px]">
                                    <BiMapPin className="text-orange-500 text-xs" />
                                    {currentCoords
                                        ? `${currentCoords.latitude?.toFixed(3)}, ${currentCoords.longitude?.toFixed(3)}`
                                        : "Acquiring GPS..."}
                                </span>
                                {onRefreshLocation && (
                                    <button
                                        type="button"
                                        onClick={onRefreshLocation}
                                        title="Sync GPS location"
                                        className="text-gray-400 hover:text-orange-600 transition"
                                    >
                                        <BiRefresh className="text-sm" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Online Switcher & Logout */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onToggleStatus}
                            disabled={statusLoading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 ${
                                isOnline
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-white animate-ping" : "bg-gray-400"}`} />
                            <BiPowerOff className="text-sm" />
                            {statusLoading ? "SAVING..." : isOnline ? "ONLINE" : "OFFLINE"}
                        </button>

                        <button
                            type="button"
                            onClick={onLogout}
                            title="Log out from rider account"
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        >
                            <BiLogOut className="text-xl" />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex space-x-1 sm:space-x-4 border-t border-gray-100 overflow-x-auto py-1 scrollbar-none">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onTabChange(item.id)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                    isActive
                                        ? "bg-orange-50 text-orange-600 font-bold"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                            >
                                <Icon className={`text-base ${isActive ? "text-orange-500" : "text-gray-400"}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </header>
    );
};


export default RiderNavbar;
