import ApiError from '../utils/apiError.js';


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
        phone,
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

    const requiredFields = {
        recipientName,
        phone,
        addressLine1,
        city,
        state,
        postalCode,
        countryCode
    };

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

    const trimmedLabel = label?.trim() || "Home";

    const values = [
        trimmedLabel,
        sanitizedData.recipientName,
        sanitizedData.phone,
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

    // Attach named properties to the array for backward compatibility
    values.label = trimmedLabel;
    values.recipientName = sanitizedData.recipientName;
    values.phone = sanitizedData.phone;
    values.addressLine1 = sanitizedData.addressLine1;
    values.addressLine2 = addressLine2?.trim() || "";
    values.landmark = landmark?.trim() || "";
    values.city = sanitizedData.city;
    values.state = sanitizedData.state;
    values.postalCode = sanitizedData.postalCode;
    values.countryCode = sanitizedData.countryCode;
    values.formattedAddress = formattedAddress?.trim() || "";
    values.isDefault = Boolean(isDefault);
    values.longitude = lon;
    values.latitude = lat;

    return values;
};


export default validateAddress;