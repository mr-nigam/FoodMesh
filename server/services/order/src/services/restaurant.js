import {
    ApiError
} from '@foodmesh/utils';

import {
    setCache,
    getCache,
    deleteMultipleCache,
    cachePaginatedList,
    getPaginatedList
} from '@foodmesh/redis';

import {
    publishEvent,
    KAFKA_TOPICS,
    KAFKA_EVENTS,
    createOrdersEvent
} from "@foodmesh/kafka";

import{
    fetchOrdersRepo,
    fetchOrderRepo,
    updateOrderStatusRepo
} from '../repositories/restaurant.js';

import { 
    emitRealtimeEvent 
} from '../clients/realtime.js';


const ALLOWED_ORDER_STATUS_FOR_UPDATE = [
    'accepted',
    'preparing',
    'ready',
    'rejected'
];

const fetchOrdersService = async({
    req
}) => {

    const restaurantId = 
        req?.params?.restaurantId ??
        req?.user?.restaurantId ??
        null;

    if(!restaurantId){
        throw new ApiError(
            400,
            "Restaurant ID is required"
        );
    }

    const page = Number(req.query.page) || 1;
    const limit = Math.min(
        Number(req.query.limit) || 50,
        100
    );
    
    const offset = (page - 1) * limit;
    
    const cacheKey = `restaurant:orders:${restaurantId}`;

    const cachedOrders = await getPaginatedList({
        key: cacheKey,
        page,
        limit
    });

    if(cachedOrders && cachedOrders.length !== 0){
        return cachedOrders;
    }

    const orders = await fetchOrdersRepo({
        restaurantId,
        limit,
        offset
    });

    const ttl = 60*60;
    await cachePaginatedList({
        cacheKey,
        items: orders,
        ttl
    });

    return orders;
};

const fetchOrderService = async({
    req
}) => {

    const restaurantId = 
        req?.body?.restaurantId ??
        req?.user?.restaurantId ??
        null;
    
    const orderId = 
        req.params?.orderId ?? 
        req.params?.id ?? 
        null;

    const orderRestaurantId = 
        req.params?.orderRestaurantId ?? 
        req.body?.orderRestaurantId ?? 
        null;

    if(!orderId || (!restaurantId && !orderRestaurantId)){
        throw new ApiError(
            400,
            "Please provide order and restaurant id"
        );
    }

    const cacheKey = `restaurant:order:${restaurantId}:${orderId}`;

    const cachedOrder = await getCache({
        key: cacheKey
    });

    if(!cachedOrder){
        return cachedOrder;
    }

    const order = await fetchOrderRepo({
        orderId,
        orderRestaurantId,
        restaurantId
    });

    if(!order){
        throw new ApiError(
            404,
            "Order not found"
        );
    }

    const ttl = 60*60;
    await setCache({
        key: cacheKey,
        value: order,
        ttl
    });

    return order;
};

const updateOrderStatusService = async({
    req
}) => {

    const status = 
        req.body?.status?.trim()?.toLowerCase()
        ?? null;

    if(!status){
        throw new ApiError(
            400,
            "Status is required"
        );
    }

    if(!ALLOWED_ORDER_STATUS_FOR_UPDATE.includes(status)){
        throw new ApiError(
            400,
            `Invalid status "${rawStatus}". Allowed statuses: ${ALLOWED_ORDER_STATUS_FOR_UPDATE.join(", ")}`
        );
    }

    const orderId = 
        req.params?.orderId ??
        null;
  
    const orderRestaurantId = 
        req.body?.orderRestaurantId ?? 
        null;
    
    const restaurantId = 
        req.body?.restaurantId ?? 
        req.user?.restaurantId ?? 
        null;

    if(!orderId && !orderRestaurantId){
        throw new ApiError(
            400,
            "Please provide orderId or orderRestaurantId"
        );
    }

    const order = await updateOrderStatusRepo({
        status,
        orderRestaurantId,
        orderId,
        restaurantId
    });

    if(!order){
        throw new ApiError(
            404,
            "Order not found or status could not be updated"
        );
    }

    const orderCacheKey = `restaurant:order:${restaurantId}:${orderId}`;
    const ordersCacheKey = `restaurant:orders:${restaurantId}`;
    await deleteMultipleCache({
        keys: [orderCacheKey, ordersCacheKey]
    });

    let eventType = null;
    const upperStatus = status.toUpperCase();
    if(upperStatus === 'ACCEPTED'){
        eventType = KAFKA_EVENTS.ORDER.ACCEPTED;
    }else if(upperStatus === 'REJECTED'){
        eventType = KAFKA_EVENTS.ORDER.REJECTED;
    }else if(upperStatus === 'PREPARING'){
        eventType = KAFKA_EVENTS.ORDER.PREPARING;
    }else if(upperStatus === 'READY'){
        eventType = KAFKA_EVENTS.ORDER.READY;
    }

    if(eventType){
        try{
            const orderStatusUpdateEvent = createOrdersEvent({
                eventType,
                eventData: {
                    orderId,
                    orderRestaurantId,
                    restaurantId,
                    status,
                    totalAmount: order.total_amount,
                    userId: order?.user_id ?? null
                }
            });

            await publishEvent({
                topic: KAFKA_TOPICS.ORDER,
                key: orderId,
                event: orderStatusUpdateEvent
            });
        }catch(kafkaError){
            console.error("[Kafka] Failed to publish order status update:", kafkaError.message);
        }
    }

    // Realtime notification to restaurant and user
    if(restaurantId){
        emitRealtimeEvent({
            event: "order:status_updated",
            room: `restaurant:${restaurantId}`,
            payload: {
                orderId,
                orderRestaurantId,
                status,
                order
            }
        });
    }

    if(order.user_id){
        emitRealtimeEvent({
            event: "order:status_updated",
            room: `user:${order.user_id}`,
            payload: {
                orderId,
                orderRestaurantId,
                status,
                order
            }
        });
    }

    return order;
};


export{
    fetchOrdersService,
    fetchOrderService,
    updateOrderStatusService
};