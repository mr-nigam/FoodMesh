import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BiEdit, BiMapPin, BiSave } from "react-icons/bi";

import { restaurantService } from "../config/constants";

const RestaurantProfile = ({ restaurant, onUpdate, isSeller }) => {
    const [editMode, setEditMode] = useState(false);

    const [name, setName] = useState(
        restaurant?.name || ""
    );

    const [description, setDescription] = useState(
        restaurant?.description || ""
    );

    const [isOpen, setIsOpen] = useState(
        restaurant?.isOpen ??
        restaurant?.is_open ??
        false
    );

    const [loading, setLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);

    const getAuthConfig = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

    const toggleOpenStatus = async () => {
        if (statusLoading) return;

        try {
            setStatusLoading(true);

            const newStatus = !isOpen;

            const { data } = await axios.patch(
                `${restaurantService}/status`,
                {
                    status: newStatus,
                },
                getAuthConfig()
            );

            const updatedRestaurant =
                data?.data?.restaurant;

            const updatedStatus =
                updatedRestaurant?.isOpen ??
                updatedRestaurant?.is_open ??
                newStatus;

            setIsOpen(updatedStatus);

            if (updatedRestaurant && onUpdate) {
                onUpdate(updatedRestaurant);
            }

            toast.success(
                data?.data?.message ||
                "Status updated successfully"
            );
        } catch (error) {
            console.error(
                "Failed to update restaurant status:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Failed to update restaurant status"
            );
        } finally {
            setStatusLoading(false);
        }
    };

    const saveChanges = async () => {
        if (loading) return;

        const trimmedName = name.trim();
        const trimmedDescription = description.trim();

        if (!trimmedName) {
            toast.error(
                "Restaurant name cannot be empty"
            );
            return;
        }

        try {
            setLoading(true);

            const { data } = await axios.put(
                `${restaurantService}/edit`,
                {
                    name: trimmedName,
                    description: trimmedDescription,
                },
                getAuthConfig()
            );

            const updatedRestaurant =
                data?.data?.restaurant;

            if (updatedRestaurant) {
                setName(
                    updatedRestaurant.name || ""
                );

                setDescription(
                    updatedRestaurant.description || ""
                );

                setIsOpen(
                    updatedRestaurant.isOpen ??
                    updatedRestaurant.is_open ??
                    isOpen
                );

                if (onUpdate) {
                    onUpdate(updatedRestaurant);
                }
            } else if (onUpdate) {
                onUpdate({
                    ...restaurant,
                    name: trimmedName,
                    description: trimmedDescription,
                });
            }

            toast.success(
                data?.data?.message ||
                "Restaurant updated successfully"
            );

            setEditMode(false);
        } catch (error) {
            console.error(
                "Failed to update restaurant:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Failed to update restaurant"
            );
        } finally {
            setLoading(false);
        }
    };

    const cancelEdit = () => {
        setName(restaurant?.name || "");
        setDescription(
            restaurant?.description || ""
        );

        setEditMode(false);
    };

    if (!restaurant) {
        return (
            <div className="mx-auto max-w-xl rounded-xl bg-white p-5 text-center shadow-sm">
                <p className="text-sm text-gray-500">
                    Restaurant information is not available.
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-xl overflow-hidden rounded-xl bg-white shadow-sm">
            {restaurant?.pictures_urls?.[0] && (
                <img
                    src={restaurant.pictures_urls[0]}
                    alt={
                        restaurant.name ||
                        "Restaurant"
                    }
                    className="h-48 w-full object-cover"
                />
            )}

            <div className="space-y-4 p-5">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">

                    {/* Restaurant Details */}
                    <div className="min-w-0 flex-1">

                        {editMode && isSeller ? (
                            <div className="space-y-3">

                                {/* Name */}
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) =>
                                        setName(
                                            e.target.value
                                        )
                                    }
                                    disabled={loading}
                                    className="w-full rounded border px-2 py-1 text-lg font-semibold outline-none focus:border-black disabled:bg-gray-100"
                                    placeholder="Restaurant Name"
                                />

                                {/* Description */}
                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(
                                            e.target.value
                                        )
                                    }
                                    disabled={loading}
                                    className="w-full resize-none rounded border px-2 py-1 text-sm text-gray-600 outline-none focus:border-black disabled:bg-gray-100"
                                    placeholder="Description"
                                    rows={3}
                                />

                                {/* Buttons */}
                                <div className="flex gap-2">

                                    <button
                                        type="button"
                                        onClick={saveChanges}
                                        disabled={loading}
                                        className="flex items-center gap-1 rounded bg-black px-3 py-1 text-sm text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <BiSave size={16} />

                                        {loading
                                            ? "Saving..."
                                            : "Save"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        disabled={loading}
                                        className="rounded border px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-xl font-semibold">
                                    {restaurant.name ||
                                        "Unnamed Restaurant"}
                                </h2>

                                {restaurant.description ? (
                                    <p className="mt-1 text-sm text-gray-600">
                                        {
                                            restaurant.description
                                        }
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-400">
                                        No description added
                                    </p>
                                )}
                            </>
                        )}

                        {/* Location */}
                        <div className="mt-3 flex items-start gap-2 text-sm text-gray-500">
                            <BiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                            <span>
                                {restaurant?.autoLocation?.formattedAddress ||
                                    restaurant?.auto_location?.formatted_address ||
                                    restaurant?.formattedAddress ||
                                    restaurant?.formatted_address ||
                                    restaurant?.address ||
                                    "Location is not available"}
                            </span>
                        </div>
                    </div>

                    {/* Seller Actions */}
                    {isSeller && !editMode && (
                        <div className="flex shrink-0 items-center gap-2">

                            {/* Open / Closed */}
                            <button
                                type="button"
                                onClick={
                                    toggleOpenStatus
                                }
                                disabled={
                                    statusLoading
                                }
                                className={`rounded px-2 py-1 text-xs text-white transition ${
                                    isOpen
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                {statusLoading
                                    ? "Updating..."
                                    : isOpen
                                    ? "Open"
                                    : "Closed"}
                            </button>

                            {/* Edit */}
                            <button
                                type="button"
                                onClick={() =>
                                    setEditMode(true)
                                }
                                disabled={loading}
                                className="text-gray-500 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                                title="Edit restaurant"
                            >
                                <BiEdit size={18} />
                            </button>

                        </div>
                    )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between border-t pt-3">
                    <span
                        className={`text-sm font-medium ${
                            isOpen
                                ? "text-green-600"
                                : "text-red-500"
                        }`}
                    >
                        {isOpen
                            ? "OPEN"
                            : "CLOSED"}
                    </span>
                </div>

                {/* Created Date */}
                {restaurant.created_at && (
                    <div className="text-xs text-gray-400">
                        Created On{" "}
                        {new Date(
                            restaurant.created_at
                        ).toLocaleDateString()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantProfile;