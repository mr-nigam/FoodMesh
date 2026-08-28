import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { addressService } from '../config/constants';
import LocationPickerModal from './LocationPickerModal';
import { BiMapPin, BiHomeAlt, BiBriefcase, BiPlus, BiMap, BiX, BiCheck } from 'react-icons/bi';

const AddressSelectorModal = ({ isOpen, onClose, selectedAddressId, onSelectAddress }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMapOpen, setIsMapOpen] = useState(false);

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(addressService, {
                headers: getAuthHeader(),
                withCredentials: true
            });
            if (data?.data?.addresses) {
                setAddresses(data.data.addresses);
            }
        } catch (error) {
            console.error('Failed to fetch addresses:', error);
            toast.error('Failed to load saved addresses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchAddresses();
        }
    }, [isOpen]);

    const getLabelIcon = (label) => {
        const lower = (label || '').toLowerCase();
        if (lower.includes('home')) return <BiHomeAlt className="h-5 w-5 text-blue-500" />;
        if (lower.includes('work') || lower.includes('office')) return <BiBriefcase className="h-5 w-5 text-purple-500" />;
        return <BiMapPin className="h-5 w-5 text-emerald-500" />;
    };

    // Callback when user picks custom map location directly during checkout
    const handleMapLocationSelect = (locationDetails) => {
        const customAddress = {
            id: `temp_${Date.now()}`,
            label: 'Custom Map Location',
            recipient_name: 'Delivery Contact',
            phone: '',
            address_line_1: locationDetails.addressLine1 || locationDetails.formattedAddress || 'Selected Location',
            city: locationDetails.city || 'City',
            state: locationDetails.state || 'State',
            postal_code: locationDetails.postalCode || '',
            country_code: locationDetails.countryCode || 'IN',
            latitude: locationDetails.lat,
            longitude: locationDetails.lng,
            is_custom: true
        };
        onSelectAddress(customAddress);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="flex flex-col max-h-[85vh] w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <BiMapPin className="text-red-500" /> Choose Delivery Address
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Select a saved address or pick a different location on map
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
                    >
                        <BiX className="h-6 w-6" />
                    </button>
                </div>

                {/* Address List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="py-12 text-center text-sm font-medium text-gray-500">
                            Loading saved addresses...
                        </div>
                    ) : addresses.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                            No saved addresses found. Please add a new address or pick on map below.
                        </div>
                    ) : (
                        addresses.map((address) => {
                            const isSelected = selectedAddressId === address.id;

                            return (
                                <div
                                    key={address.id}
                                    onClick={() => {
                                        onSelectAddress(address);
                                        onClose();
                                    }}
                                    className={`cursor-pointer rounded-2xl border p-4 transition flex items-start gap-4 ${
                                        isSelected
                                            ? 'border-red-500 bg-red-50/40 ring-2 ring-red-100 shadow-xs'
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="mt-1">
                                        <input
                                            type="radio"
                                            name="deliveryAddress"
                                            checked={isSelected}
                                            onChange={() => {}}
                                            className="h-4 w-4 accent-red-600 cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getLabelIcon(address.label)}
                                            <span className="font-bold text-gray-900 text-sm">{address.label}</span>
                                            {address.is_default && (
                                                <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                                    Default
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs font-bold text-gray-800">{address.recipient_name} • {address.phone}</p>
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                            {address.address_line_1}
                                            {address.address_line_2 && `, ${address.address_line_2}`}
                                        </p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            {address.city}, {address.state} - {address.postal_code}
                                        </p>
                                    </div>

                                    {isSelected && (
                                        <BiCheck className="h-6 w-6 text-red-600 shrink-0" />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="border-t bg-gray-50 p-4 flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={() => setIsMapOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800 transition"
                    >
                        <BiMap className="h-5 w-5" />
                        Pick Other Location on Map
                    </button>
                </div>

                {/* Map Location Picker */}
                <LocationPickerModal
                    isOpen={isMapOpen}
                    onClose={() => setIsMapOpen(false)}
                    onSelectLocation={handleMapLocationSelect}
                />

            </div>
        </div>
    );
};

export default AddressSelectorModal;
