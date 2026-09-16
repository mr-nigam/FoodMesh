import React, { useState } from "react";
import {
    BiPackage,
    BiStore,
    BiUser,
    BiRupee,
    BiCheckCircle,
    BiXCircle,
    BiSearch,
    BiCalendar,
    BiChevronDown,
    BiChevronUp
} from "react-icons/bi";

const sampleDeliveries = [
    {
        id: "ORD-982134",
        date: "Today, 02:45 PM",
        restaurantName: "Royal Biryani & Rolls",
        restaurantAddress: "Shop 4, Connaught Place, New Delhi",
        customerName: "Parvesh Nigam",
        customerAddress: "Flat 402, Green Avenue, Delhi",
        items: [{ name: "Special Chicken Biryani", quantity: 2 }, { name: "Paneer Roll", quantity: 1 }],
        distance: "3.2 km",
        duration: "18 mins",
        earnings: 65.00,
        tip: 20.00,
        status: "delivered"
    },
    {
        id: "ORD-874312",
        date: "Today, 12:15 PM",
        restaurantName: "Domino's Pizza Hub",
        restaurantAddress: "Sector 18, Block B, Noida",
        customerName: "Sneha Sharma",
        customerAddress: "Tower 3, Apex Heights, Sector 62",
        items: [{ name: "Farmhouse Pizza (Medium)", quantity: 1 }, { name: "Garlic Breadsticks", quantity: 1 }],
        distance: "4.5 km",
        duration: "24 mins",
        earnings: 80.00,
        tip: 0.00,
        status: "delivered"
    },
    {
        id: "ORD-762198",
        date: "Yesterday, 08:30 PM",
        restaurantName: "Burger King",
        restaurantAddress: "Mall of India, Noida",
        customerName: "Rahul Verma",
        customerAddress: "House 12, Pocket A, Mayur Vihar",
        items: [{ name: "Crispy Veg Double Patty", quantity: 2 }, { name: "Peri Peri Fries", quantity: 1 }],
        distance: "5.1 km",
        duration: "27 mins",
        earnings: 95.00,
        tip: 30.00,
        status: "delivered"
    }
];

const RiderDeliveriesHistory = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [expandedId, setExpandedId] = useState(null);

    const filtered = sampleDeliveries.filter((d) => {
        const matchesSearch =
            d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Delivery History & Completed Orders</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Track all your past completed trips, route distances, and tips received.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">Filter:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
                        >
                            <option value="all">All Trips</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by Order ID, restaurant, or customer name..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:bg-white focus:outline-none transition"
                    />
                </div>
            </div>

            {/* List of Orders */}
            <div className="space-y-3">
                {filtered.length > 0 ? (
                    filtered.map((item) => {
                        const isExpanded = expandedId === item.id;
                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden transition hover:border-orange-200"
                            >
                                <div
                                    onClick={() => toggleExpand(item.id)}
                                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                            <BiCheckCircle className="text-xl" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900 text-sm">{item.id}</h3>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                <BiCalendar className="text-xs" /> {item.date} • {item.distance}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-right">
                                        <div>
                                            <p className="font-black text-gray-900 text-base flex items-center justify-end">
                                                <BiRupee />{(item.earnings + item.tip).toFixed(2)}
                                            </p>
                                            {item.tip > 0 && (
                                                <p className="text-[10px] text-emerald-600 font-bold">Includes ₹{item.tip} Tip</p>
                                            )}
                                        </div>
                                        <div className="text-gray-400 text-xl">
                                            {isExpanded ? <BiChevronUp /> : <BiChevronDown />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details Drawer */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50 space-y-4 text-xs">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                            <div className="p-3 bg-white rounded-xl border border-gray-200/70 space-y-1">
                                                <p className="font-bold text-orange-700 uppercase text-[10px] flex items-center gap-1">
                                                    <BiStore /> Restaurant
                                                </p>
                                                <p className="font-bold text-gray-900">{item.restaurantName}</p>
                                                <p className="text-gray-500 text-[11px]">{item.restaurantAddress}</p>
                                            </div>

                                            <div className="p-3 bg-white rounded-xl border border-gray-200/70 space-y-1">
                                                <p className="font-bold text-emerald-700 uppercase text-[10px] flex items-center gap-1">
                                                    <BiUser /> Customer
                                                </p>
                                                <p className="font-bold text-gray-900">{item.customerName}</p>
                                                <p className="text-gray-500 text-[11px]">{item.customerAddress}</p>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-white rounded-xl border border-gray-200/70">
                                            <p className="font-bold text-gray-600 text-[10px] uppercase mb-1.5">Delivered Items</p>
                                            <ul className="space-y-1 text-gray-700">
                                                {item.items.map((it, idx) => (
                                                    <li key={idx} className="flex justify-between">
                                                        <span>{it.name}</span>
                                                        <span className="font-bold">x{it.quantity}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="flex justify-between text-[11px] text-gray-500 pt-1 font-medium">
                                            <span>Trip Duration: <strong>{item.duration}</strong></span>
                                            <span>Base Pay: <strong>₹{item.earnings.toFixed(2)}</strong></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-xs">
                        No past deliveries found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiderDeliveriesHistory;
