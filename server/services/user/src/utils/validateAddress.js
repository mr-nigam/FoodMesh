import {
    ApiError
} from '@foodmesh/utils';


const checkCoordinates = ({
    latitude,
    longitude
}) => {
    if(
        latitude === undefined ||
        longitude === undefined ||
        latitude === null ||
        longitude === null
    ){
        throw new ApiError(
            400,
            "latitude and longitude are required for address"
        );
    }
    const lat = Number(latitude);
    const lon = Number(longitude);
    if(
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
    ){
        throw new ApiError(400, "latitude and longitude must be valid numbers");
    }
    if(lat < -90 || lat > 90){
        throw new ApiError(400, "Invalid latitude");
    }
    if(lon < -180 || lon > 180){
        throw new ApiError(400, "Invalid longitude");
    }
    return { lat, lon };
};

const validateAddress = (addressData = {}) => {
    const {
        label,
        recipientName,
        recipientPhone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        postalCode,
        countryCode,
        latitude,
        longitude,
        formattedAddress,
        isDefault
    } = addressData;
    const { lat, lon } = checkCoordinates({ latitude, longitude });
    const country = countryCode?.trim() || "IN";
    const requiredFields = {
        recipientName,
        recipientPhone,
        addressLine1,
        city,
        state,
        postalCode
    };

    // Explicitly define required key types to prevent implicit indexing errors
    const sanitizedData = {};
    for (const [key, value] of Object.entries(requiredFields)){
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if(!trimmed){
            throw new ApiError(
                400,
                `${key} is required`
            );
        }
        sanitizedData[key] = trimmed;
    }
    sanitizedData.countryCode = country;
    
    // Phone E.164 formatting & validation for PostgreSQL check constraint (^\+[1-9][0-9]{6,14}$)
    let formattedPhone = sanitizedData.recipientPhone.replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
        if (/^[1-9][0-9]{9}$/.test(formattedPhone)) {
            formattedPhone = `+91${formattedPhone}`;
        } else if (/^[1-9][0-9]{6,14}$/.test(formattedPhone)) {
            formattedPhone = `+${formattedPhone}`;
        }
    }
    const phoneRegex = /^\+[1-9][0-9]{6,14}$/;
    if (!phoneRegex.test(formattedPhone)) {
        throw new ApiError(
            400,
            "Invalid phone number format. Please provide a valid phone number with country code (e.g. +919876543210 or 10-digit mobile number)."
        );
    }
    sanitizedData.recipientPhone = formattedPhone;
    const trimmedLabel = label?.trim() || "Home";

    const values = [
        trimmedLabel,
        sanitizedData.recipientName,
        sanitizedData.recipientPhone,
        sanitizedData.addressLine1,
        addressLine2?.trim() || "",
        landmark?.trim() || "",
        sanitizedData.city,
        sanitizedData.state,
        sanitizedData.postalCode,
        sanitizedData.countryCode,
        formattedAddress?.trim() || "",
        Boolean(isDefault),
        lon,
        lat
    ];

    // Explicitly define named properties via Object.assign while preserving the returned Array instance
    return Object.assign(values, {
        label: trimmedLabel,
        recipientName: sanitizedData.recipientName,
        recipientPhone: sanitizedData.recipientPhone,
        addressLine1: sanitizedData.addressLine1,
        addressLine2: addressLine2?.trim() || "",
        landmark: landmark?.trim() || "",
        city: sanitizedData.city,
        state: sanitizedData.state,
        postalCode: sanitizedData.postalCode,
        countryCode: sanitizedData.countryCode,
        formattedAddress: formattedAddress?.trim() || "",
        isDefault: Boolean(isDefault),
        longitude: lon,
        latitude: lat
    });
};


export default validateAddress;