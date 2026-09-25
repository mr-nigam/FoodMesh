import {
    setCache
} from '@foodmesh/redis';

import {
    ApiError
} from '@foodmesh/utils';

import {
    createDeliveryRepo
} from '../repositories/internal.js';

import {
    getRoadDistanceAndTime
} from '../clients/google.js';


const normalizePhone = (phone) => {
    if(!phone) return '+919999999999';
    const cleaned = String(phone).replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    return `+${cleaned}`;
};


const createDeliveryService = async ({
    order
}) => {

    if(!order){
        throw new ApiError(
            400,
            "Order payload is required to create delivery"
        );
    }

    const orderId = order.order_id;
    const orderRestaurantId = order.order_restaurant_id;
    const userId = order.user_id;

    const pickupLongitude = Number(order.pickup_longitude ?? 0);
    const pickupLatitude = Number(order.pickup_latitude ?? 0);

    const deliveryAddress = typeof order.delivery_address === 'string'
        ? JSON.parse(order.delivery_address)
        : (order.delivery_address || {});

    const dropLongitude = Number(
        order.delivery_longitude ??
        deliveryAddress.longitude ??
        order.drop_longitude ??
        0
    );

    const dropLatitude = Number(
        order.delivery_latitude ??
        deliveryAddress.latitude ??
        order.drop_latitude ??
        0
    );

    const {
        estimatedDistanceMeters,
        estimatedDurationSeconds
    } = await getRoadDistanceAndTime({
        pickupLongitude,
        pickupLatitude,
        dropLongitude,
        dropLatitude
    });

    const recipientPhone = normalizePhone(order.recipient_phone);

    const params = [
        orderId,
        orderRestaurantId,
        userId,

        order.restaurant_id,
        order.restaurant_name,
        JSON.stringify(order.restaurant_address || {}),

        order.recipient_name || "Customer",
        recipientPhone,
        JSON.stringify(deliveryAddress),

        pickupLongitude,
        pickupLatitude,

        dropLongitude,
        dropLatitude,

        estimatedDistanceMeters,
        estimatedDurationSeconds,
    ];

    const delivery = await createDeliveryRepo({
        params
    });

    if(!delivery){
        throw new ApiError(
            500,
            "Failed to create delivery entry"
        );
    }

    const cacheKey = `delivery:order:${orderId}:restaurantOrder:${orderRestaurantId}`;

    await setCache({
        key: cacheKey,
        value: delivery,
        ttl: 3600
    });

    return delivery;
};


export {
    createDeliveryService
};