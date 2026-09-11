import {
    BiBriefcase,
    BiHomeAlt,
    BiLoader,
    BiMapPin,
    BiChevronRight,
} from "react-icons/bi";


const getLabelIcon = (label) => {
    const normalized = (label ?? "").toLowerCase();

    if (normalized.includes("home")) {
        return <BiHomeAlt className="h-5 w-5 text-blue-500" />;
    }

    if (
        normalized.includes("work") ||
        normalized.includes("office")
    ) {
        return <BiBriefcase className="h-5 w-5 text-purple-500" />;
    }

    return <BiMapPin className="h-5 w-5 text-emerald-500" />;
};

const getAddressText = (address) => {
    return (
        address?.formatted_address ||
        address?.formattedAddress ||
        [
            address?.address_line_1 || address?.addressLine1,
            address?.city,
        ]
            .filter(Boolean)
            .join(", ")
    );
};

const DeliveryAddressBanner = ({
    address,
    loading,
    error,
    onChange,
}) => {
    const addressText = getAddressText(address);
    const recipientName =
        address?.recipient_name ||
        address?.recipientName ||
        "Recipient";

    const postalCode =
        address?.postal_code ||
        address?.postalCode ||
        "";

    return (
        <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-100 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                    {loading ? (
                        <BiLoader className="h-6 w-6 animate-spin" />
                    ) : (
                        getLabelIcon(address?.label)
                    )}
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Delivering To
                        </span>

                        {address?.label && (
                            <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-600">
                                {address.label}
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <p className="mt-0.5 text-sm font-semibold text-gray-500">
                            Loading delivery address...
                        </p>
                    ) : error ? (
                        <p className="mt-0.5 text-sm font-semibold text-red-600">
                            Unable to load delivery address.
                        </p>
                    ) : address ? (
                        <p className="mt-0.5 break-words text-sm font-bold text-gray-900">
                            {recipientName}
                            {" • "}
                            {addressText || "Address details unavailable"}
                            {postalCode ? ` (${postalCode})` : ""}
                        </p>
                    ) : (
                        <p className="mt-0.5 text-sm font-semibold text-red-600">
                            No delivery address selected. Please pick an
                            address.
                        </p>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={onChange}
                className="flex shrink-0 items-center gap-1 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 hover:text-red-700"
            >
                {address ? "Change Address" : "Select Address"}
                <BiChevronRight className="h-5 w-5" />
            </button>
        </div>
    );
};


export default DeliveryAddressBanner;