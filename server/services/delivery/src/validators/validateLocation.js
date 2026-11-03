import { ApiError } from "@foodmesh/utils";

const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const validateLocationInput = (body = {}) => {
    const {
        orderId,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        timestamp,
        sequence
    } = body;

    if (!orderId || typeof orderId !== "string" || !orderId.trim()) {
        throw new ApiError(400, "Valid orderId is required");
    }

    if (latitude === undefined || latitude === null || typeof latitude !== "number" || !Number.isFinite(latitude)) {
        throw new ApiError(400, "Valid latitude number is required");
    }

    if (longitude === undefined || longitude === null || typeof longitude !== "number" || !Number.isFinite(longitude)) {
        throw new ApiError(400, "Valid longitude number is required");
    }

    if (latitude < -90 || latitude > 90) {
        throw new ApiError(400, "Latitude must be between -90 and 90");
    }

    if (longitude < -180 || longitude > 180) {
        throw new ApiError(400, "Longitude must be between -180 and 180");
    }

    if (accuracy !== undefined && accuracy !== null) {
        const numAcc = Number(accuracy);
        if (!Number.isFinite(numAcc) || numAcc < 0) {
            throw new ApiError(400, "Accuracy must be a non-negative number");
        }
    }

    if (speed !== undefined && speed !== null) {
        const numSpeed = Number(speed);
        if (!Number.isFinite(numSpeed) || numSpeed < 0) {
            throw new ApiError(400, "Speed must be a non-negative number");
        }
    }

    if (heading !== undefined && heading !== null) {
        const numHeading = Number(heading);
        if (!Number.isFinite(numHeading) || numHeading < 0 || numHeading > 360) {
            throw new ApiError(400, "Heading must be between 0 and 360 degrees");
        }
    }

    if (timestamp === undefined || timestamp === null) {
        throw new ApiError(400, "Timestamp is required");
    }

    const numTimestamp = Number(timestamp);
    if (!Number.isFinite(numTimestamp) || numTimestamp <= 0) {
        throw new ApiError(400, "Valid timestamp is required");
    }

    const now = Date.now();
    // Reject timestamps more than 10 seconds in the future
    if (numTimestamp > now + 10000) {
        throw new ApiError(400, "Timestamp cannot be in the future");
    }

    // Reject timestamps older than 5 minutes
    if (numTimestamp < now - 300000) {
        throw new ApiError(400, "Timestamp is too old (exceeds stale threshold)");
    }

    if (sequence === undefined || sequence === null) {
        throw new ApiError(400, "Sequence number is required");
    }

    const numSequence = Number(sequence);
    if (!Number.isInteger(numSequence) || numSequence < 0) {
        throw new ApiError(400, "Sequence must be a non-negative integer");
    }

    return {
        orderId: orderId.trim(),
        latitude,
        longitude,
        accuracy: accuracy !== undefined && accuracy !== null ? Number(accuracy) : null,
        speed: speed !== undefined && speed !== null ? Number(speed) : null,
        heading: heading !== undefined && heading !== null ? Number(heading) : null,
        timestamp: numTimestamp,
        sequence: numSequence
    };
};

const validateMovementPlausibility = ({ previousLocation, newLocation }) => {
    if (!previousLocation) return true;

    // Check sequence and timestamp ordering
    if (newLocation.sequence <= previousLocation.sequence && newLocation.timestamp <= previousLocation.timestamp) {
        throw new ApiError(400, "Stale or out-of-order location update");
    }

    const timeDeltaSeconds = Math.max(0.1, (newLocation.timestamp - previousLocation.timestamp) / 1000);
    const distanceMeters = haversineDistanceMeters(
        previousLocation.latitude,
        previousLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
    );

    const calculatedSpeedMps = distanceMeters / timeDeltaSeconds;
    // 150 m/s is ~540 km/h, well beyond standard urban motorcycle / courier speed
    if (calculatedSpeedMps > 150 && distanceMeters > 5000) {
        throw new ApiError(400, "Unrealistic GPS coordinate jump detected");
    }

    return true;
};

export {
    validateLocationInput,
    validateMovementPlausibility,
    haversineDistanceMeters
};
