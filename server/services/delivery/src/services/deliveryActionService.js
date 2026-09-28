import {
    setCache,
    deleteGeoCache,
    deleteOrderRelatedCache
} from '@foodmesh/redis';

import {
    ApiError
} from '@foodmesh/utils';

import {
    publishEvent,
    KAFKA_TOPICS,
    KAFKA_EVENTS,
    createDeliveryEvent
} from '@foodmesh/kafka';

import {
    emitRealtimeEvent
} from '../clients/realtime.js';

import {
    acceptDeliveryOfferRepo,
    rejectDeliveryOfferRepo,
    getActiveDeliveryByRiderRepo,
    updateDeliveryStatusRepo
} from '../repositories/deliveryActionRepo.js';


const acceptOfferService = async ({
    req
}) => {

    const riderId = req.user?.riderId?.trim();
    const riderUserId = req.user?.id?.trim();

    const offerId = req.params?.offerId;
    const deliveryId = req.body?.deliveryId ?? req.query?.deliveryId;

    if(!riderId){
        throw new ApiError(
            403,
            "You must be registered as a rider to accept offers"
        );
    }

    if(!offerId){
        throw new ApiError(
            400,
            "Offer ID is required"
        );
    }

    const delivery = await acceptDeliveryOfferRepo({
        offerId,
        riderId,
        deliveryId
    });

    if(!delivery){
        throw new ApiError(
            400,
            "Failed to accept the offer. It may have expired or already been accepted."
        );
    }

    const resolvedDeliveryId = delivery.delivery_id || delivery.id || deliveryId;

    // Cache assigned rider in Redis so appointRiderService loop terminates immediately
    await setCache({
        key: `delivery:${resolvedDeliveryId}:assigned_rider`,
        value: riderId,
        ttl: 3600
    });

    // Publish Kafka Event
    const deliveryEvent = createDeliveryEvent({
        eventType: KAFKA_EVENTS.DELIVERY.RIDER_ASSIGNED,
        eventData: {
            riderId,
            deliveryId,
            orderId: delivery.order_id,
            customerUserId: delivery.user_id,
            restaurantOrderId: delivery.restaurant_order_id,
            assignedAt: delivery.accepted_at || delivery.assigned_at || new Date().toISOString()
        }
    });

    try{
        await publishEvent({
            topic: KAFKA_TOPICS.DELIVERY,
            key: deliveryId,
            event: deliveryEvent
        });

    }catch(kErr){
        console.warn("[Kafka] Failed to publish DELIVERY.RIDER_ASSIGNED event:", kErr.message);
    }

    // Notify the accepted rider
    emitRealtimeEvent({
        event: "delivery:offer:accepted",
        room: `user:${riderUserId}`,
        payload: {
            deliveryId: resolvedDeliveryId,
            orderId: delivery.order_id,
            restaurantOrderId: delivery.restaurant_order_id,
            status: delivery.status
        }
    }).catch(() => {});

    const riderSearchCacheKey = 'riders:active';
    const memberValue = `${riderUserId}:${riderId}`;

    await deleteGeoCache({
        key: riderSearchCacheKey,
        memberValue
    });

    return delivery;
};

const rejectOfferService = async ({
    offerId,
    riderId
}) => {

    if(!riderId){
        throw new ApiError(
            403,
            "You must be registered as a rider to reject offers"
        );
    }

    if(!offerId){
        throw new ApiError(
            400,
            "Offer ID and Rider ID are required"
        );
    }

    const rejectedOffer = await rejectDeliveryOfferRepo({
        offerId,
        riderId
    });

    return rejectedOffer;
};

const getActiveDeliveryService = async ({
    riderId
}) => {

    if(!riderId){
        throw new ApiError(
            400,
            "Rider ID is required"
        );
    }

    const delivery = await getActiveDeliveryByRiderRepo({
        riderId
    });

    return delivery;
};

const updateDeliveryStatusService = async ({
    req
}) => {

    const { deliveryId } = req.params;
    // Extract status from request body (expects { status: "some_status" })
    const statusRaw = req.body?.status?.trim()?.toLowerCase();

    if (!statusRaw) {
        throw new ApiError(
            400,
            "Delivery status is required in request body"
        );
    }

    const riderId = req.user?.riderId?.trim();

    if (!riderId) {
        throw new ApiError(
            403,
            "You must be registered as a rider to update status"
        );
    }

    const validStatuses = [
        'arrived_restaurant',
        'picked_up',
        'on_the_way',
        'arrived_customer',
        'delivered',
        'cancelled'
    ];

    if (!validStatuses.includes(statusRaw)) {
        throw new ApiError(
            400,
            `Invalid delivery status: ${statusRaw}`
        );
    }

    // Translate arrival statuses to a generic "on_the_way" for internal storage
    const normalizedStatus = (statusRaw === 'arrived_restaurant' || statusRaw === 'arrived_customer') ? 'on_the_way' : statusRaw;

    const updated = await updateDeliveryStatusRepo({
        deliveryId,
        riderId,
        status: normalizedStatus
    });

    if (!updated) {
        throw new ApiError(
            404,
            "Delivery not found or not assigned to you"
        );
    }

    // Determine if we need to emit a Kafka event for order‑related statuses
    const orderRelevantStatuses = ['picked_up', 'on_the_way', 'delivered', 'arrived_restaurant', 'arrived_customer'];
    let eventType = '';
    if (orderRelevantStatuses.includes(statusRaw)) {
        if (statusRaw === 'picked_up') {
            eventType = KAFKA_EVENTS.DELIVERY.PICKED_UP;
        } else if (statusRaw === 'arrived_restaurant' || statusRaw === 'arrived_customer' || statusRaw === 'on_the_way') {
            eventType = KAFKA_EVENTS.DELIVERY.ON_THE_WAY;
        } else if (statusRaw === 'delivered') {
            eventType = KAFKA_EVENTS.DELIVERY.DELIVERED;
        }
    }
    // Fallback generic event if no specific type matched
    if (!eventType) {
        eventType = KAFKA_EVENTS.DELIVERY.STATUS_UPDATED;
    }

    const deliveryEvent = createDeliveryEvent({
        eventType,
        eventData: {
            riderId,
            deliveryId,
            orderId: updated.order_id,
            customerUserId: updated.user_id,
            restaurantOrderId: updated.restaurant_order_id
        }
    });

    try {
        await publishEvent({
            topic: KAFKA_TOPICS.DELIVERY,
            key: deliveryId,
            event: deliveryEvent
        });
    } catch (kErr) {
        console.warn('[Kafka] Failed to publish delivery status event:', kErr.message);
    }

    // Realtime notification to customer (and restaurant if applicable)
    emitRealtimeEvent({
        event: "order:status_updated",
        room: `user:${updated.user_id}`,
        payload: {
            orderId: updated.order_id,
            status: normalizedStatus,
            deliveryId
        }
    }).catch(() => {});

    await deleteOrderRelatedCache({
        orderId: updated.order_id,
        restaurantId: updated.restaurant_id,
        userId: updated.user_id,
        restaurantOrderId: updated.restaurant_order_id,
        riderId: updated.rider_id,
        deliveryId: updated.delivery_id
    });

    return updated;
};


export {
    acceptOfferService,
    rejectOfferService,
    getActiveDeliveryService,
    updateDeliveryStatusService
};