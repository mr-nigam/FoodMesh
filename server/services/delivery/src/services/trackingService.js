import crypto from "node:crypto";
import pool from "../config/postgre.js";
import { ApiError } from "@foodmesh/utils";
import {
    saveRiderLocation,
    getRiderLocation,
    getOrderTracking,
    setOrderTracking,
    publish
} from "@foodmesh/redis";
import { createLocationEvent } from "@foodmesh/kafka";
import {
    validateLocationInput,
    validateMovementPlausibility
} from "../validators/validateLocation.js";
import { sendLocationEventToKafka } from "../clients/kafkaTrackingProducer.js";

const ACTIVE_DELIVERY_STATUSES = [
    "assigned",
    "accepted",
    "picked_up",
    "on_the_way"
];

const extractCityId = (delivery) => {
    const rawCity =
        delivery?.delivery_address?.city ||
        delivery?.restaurant_address?.city ||
        delivery?.city ||
        "default";

    return String(rawCity).toLowerCase().replace(/[^a-z0-9_-]/g, "_");
};

const verifyDeliveryAssignment = async ({ orderId, riderId }) => {
    // 1. Check Redis first for O(1) performance
    const cachedTracking = await getOrderTracking({ orderId });

    if (cachedTracking) {
        if (cachedTracking.riderId !== riderId) {
            throw new ApiError(403, "Rider is not assigned to this delivery order");
        }

        if (!ACTIVE_DELIVERY_STATUSES.includes(cachedTracking.status)) {
            throw new ApiError(400, `Delivery is not active for tracking (status: ${cachedTracking.status})`);
        }

        return {
            orderId: cachedTracking.orderId,
            riderId: cachedTracking.riderId,
            customerId: cachedTracking.customerId,
            deliveryId: cachedTracking.deliveryId,
            cityId: cachedTracking.cityId,
            status: cachedTracking.status
        };
    }

    // 2. Fallback to PostgreSQL database
    const query = `
        SELECT
            id,
            order_id,
            restaurant_order_id,
            rider_id,
            user_id,
            status,
            restaurant_address,
            delivery_address
        FROM deliveries
        WHERE (order_id = $1 OR restaurant_order_id = $1)
        ORDER BY created_at DESC
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [orderId]);
    if (rows.length === 0) {
        throw new ApiError(404, "Delivery record not found for this order");
    }

    const delivery = rows[0];

    if (!delivery.rider_id || String(delivery.rider_id) !== String(riderId)) {
        throw new ApiError(403, "Rider is not assigned to this delivery order");
    }

    if (!ACTIVE_DELIVERY_STATUSES.includes(delivery.status)) {
        throw new ApiError(400, `Delivery is not active for tracking (status: ${delivery.status})`);
    }

    const cityId = extractCityId(delivery);

    // Populate Redis tracking cache
    await setOrderTracking({
        orderId: delivery.order_id,
        riderId: delivery.rider_id,
        customerId: delivery.user_id,
        deliveryId: delivery.id,
        cityId,
        status: delivery.status,
        ttl: 7200
    });

    if (delivery.restaurant_order_id) {
        await setOrderTracking({
            orderId: delivery.restaurant_order_id,
            riderId: delivery.rider_id,
            customerId: delivery.user_id,
            deliveryId: delivery.id,
            cityId,
            status: delivery.status,
            ttl: 7200
        }).catch(() => {});
    }

    return {
        orderId: delivery.order_id,
        restaurantOrderId: delivery.restaurant_order_id,
        riderId: delivery.rider_id,
        customerId: delivery.user_id,
        deliveryId: delivery.id,
        cityId,
        status: delivery.status
    };
};

const recordLocationService = async ({ riderId, body }) => {
    if (!riderId) {
        throw new ApiError(403, "Rider credentials required");
    }

    // 1. Validate payload fields and formats
    const validated = validateLocationInput(body);

    // 2. Validate rider is assigned to active delivery
    const trackingContext = await verifyDeliveryAssignment({
        orderId: validated.orderId,
        riderId
    });

    // 3. Check movement plausibility against previous location
    const previousLocation = await getRiderLocation({ riderId });
    validateMovementPlausibility({
        previousLocation,
        newLocation: validated
    });

    // 4. Save latest location to Redis GEO and Hash
    await saveRiderLocation({
        riderId,
        orderId: validated.orderId,
        cityId: trackingContext.cityId,
        latitude: validated.latitude,
        longitude: validated.longitude,
        accuracy: validated.accuracy,
        speed: validated.speed,
        heading: validated.heading,
        timestamp: validated.timestamp,
        sequence: validated.sequence
    });

    // 5. Publish to Redis Pub/Sub for Realtime WebSocket broadcast
    const eventId = crypto.randomUUID();
    const realtimePayload = {
        eventId,
        event: "tracking:location",
        orderId: validated.orderId,
        restaurantOrderId: trackingContext.restaurantOrderId || null,
        riderId,
        latitude: validated.latitude,
        longitude: validated.longitude,
        accuracy: validated.accuracy,
        speed: validated.speed,
        heading: validated.heading,
        timestamp: validated.timestamp,
        sequence: validated.sequence
    };

    await publish({
        channel: "tracking:location",
        message: realtimePayload
    });

    // 6. Asynchronously send location event to Kafka for historical batch persistence
    const kafkaEvent = createLocationEvent({
        eventId,
        orderId: validated.orderId,
        riderId,
        latitude: validated.latitude,
        longitude: validated.longitude,
        accuracy: validated.accuracy,
        speed: validated.speed,
        heading: validated.heading,
        timestamp: validated.timestamp,
        sequence: validated.sequence
    });

    sendLocationEventToKafka({
        event: kafkaEvent,
        key: riderId
    });

    return {
        eventId,
        orderId: validated.orderId,
        riderId,
        latitude: validated.latitude,
        longitude: validated.longitude,
        sequence: validated.sequence,
        timestamp: validated.timestamp
    };
};

export {
    recordLocationService,
    verifyDeliveryAssignment
};
