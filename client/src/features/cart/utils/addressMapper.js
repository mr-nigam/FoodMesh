/**
 * Maps a selected address (either saved in DB or picked custom on map)
 * to the payload format expected by the Order Service.
 */
export const buildAddressPayload = (selectedAddress) => {
    if (!selectedAddress) {
        throw new Error("Delivery address is required");
    }

    const addrId = selectedAddress.id || selectedAddress._id;
    const isCustom = selectedAddress.is_custom || (typeof addrId === "string" && addrId.startsWith("temp_"));

    if (isCustom || !addrId) {
        const formattedAddress =
            selectedAddress.formatted_address ||
            selectedAddress.formattedAddress ||
            selectedAddress.address_line_1 ||
            "Selected Location";

        const latitude = Number(selectedAddress.latitude ?? selectedAddress.lat ?? 0);
        const longitude = Number(selectedAddress.longitude ?? selectedAddress.lng ?? 0);

        const recipientName =
            selectedAddress.recipient_name ||
            selectedAddress.recipientName ||
            "Customer";

        const recipientPhone =
            selectedAddress.recipient_phone ||
            selectedAddress.phone ||
            selectedAddress.mobile ||
            "+919999999999";

        return {
            address: {
                formattedAddress,
                latitude,
                longitude,
                recipientName,
                recipientPhone,
                city: selectedAddress.city || "",
                state: selectedAddress.state || "",
                postalCode: selectedAddress.postal_code || selectedAddress.postalCode || "",
            },
        };
    }

    return {
        addressId: addrId,
    };
};

export const getAddressId = (address) => {
    if (!address) return null;
    return address.id || address._id || null;
};