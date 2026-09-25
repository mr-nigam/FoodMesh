import {
    setCache,
    deleteGeoCache
} from '@foodmesh/redis';

import {
    ApiError
} from '@foodmesh/utils';

import {
    publishEvent,
    KAFKA_TOPICS,
    KAFKA_EVENTS
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
    const userId = req.user?.id?.trim();

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

    // Notify the accepted rider
    emitRealtimeEvent({
        event: "delivery:offer:accepted",
        room: `user:${userId}`,
        payload: {
            deliveryId: resolvedDeliveryId,
            orderId: delivery.order_id,
            restaurantOrderId: delivery.restaurant_order_id,
            status: delivery.status
        }
    }).catch(() => {});

    // Notify the customer
    emitRealtimeEvent({
        event: "order:status_updated",
        room: `user:${delivery.user_id}`,
        payload: {
            orderId: delivery.order_id,
            status: "rider_assigned",
            riderId
        }
    }).catch(() => {});

    // Publish Kafka Event
    try {
        await publishEvent({
            topic: KAFKA_TOPICS.DELIVERY,
            key: resolvedDeliveryId,
            event: {
                eventType: KAFKA_EVENTS.DELIVERY.RIDER_ASSIGNED,
                timestamp: new Date().toISOString(),
                data: {
                    deliveryId: resolvedDeliveryId,
                    orderId: delivery.order_id,
                    restaurantOrderId: delivery.restaurant_order_id,
                    riderId,
                    userId: delivery.user_id,
                    assignedAt: delivery.accepted_at || delivery.assigned_at || new Date().toISOString()
                }
            }
        });

    }catch(kErr){
        console.warn("[Kafka] Failed to publish DELIVERY.RIDER_ASSIGNED event:", kErr.message);
    }

    const riderSearchCacheKey = 'riders:active';
    const memberValue = `${userId}:${riderId}`;

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
    const { status } = req.body;
    const riderId = req.user?.riderId?.trim();

    if(!riderId){
        throw new ApiError(
            403,
            "You must be registered as a rider to update status"
        );
    }

    const validStatuses = [
        'arrived_restaurant',
        'picked_up',
        'arrived_customer',
        'delivered',
        'cancelled'
    ];

    if(!validStatuses.includes(status)){
        throw new ApiError(
            400,
            `Invalid delivery status: ${status}`
        );
    }

    const updated = await updateDeliveryStatusRepo({
        deliveryId,
        riderId,
        status: status === 'arrived_restaurant' || status === 'arrived_customer' ? 'on_the_way' : status
    });

    if(!updated){
        throw new ApiError(
            404,
            "Delivery not found or not assigned to you"
        );
    }

    // Realtime notification to user
    emitRealtimeEvent({
        event: "order:status_updated",
        room: `user:${updated.user_id}`,
        payload: {
            orderId: updated.order_id,
            status,
            deliveryId
        }
    }).catch(() => {});

    return updated;
};


export {
    acceptOfferService,
    rejectOfferService,
    getActiveDeliveryService,
    updateDeliveryStatusService
};