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

    await cachePaginatedList({
        key: cacheKey,
        items: orders
    });

    return orders;
};

const fetchOrderService = async({
    req
}) => {

    const restaurantId = 
        req?.user?.restaurantId ??
        null;
    
    const orderId = 
        req.params?.orderId ?? 
        null;

    if(!orderId || (!restaurantId)){
        throw new ApiError(
            400,
            "Please provide order and restaurant id"
        );
    }

    const cacheKey = `restaurant:${restaurantId}:order:${orderId}`;

    const cachedOrder = await getCache({
        key: cacheKey
    });

    if(cachedOrder){
        return cachedOrder;
    }

    const order = await fetchOrderRepo({
        orderId,
        restaurantId
    });

    if(!order){
        throw new ApiError(
            404,
            "Order not found"
        );
    }

    const ttl = 600;
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
            `Invalid status "${status}". Allowed statuses: ${ALLOWED_ORDER_STATUS_FOR_UPDATE.join(", ")}`
        );
    }

    const orderId = 
        req.params?.orderId ??
        null;
  
    const orderRestaurantId = 
        req.body?.orderRestaurantId ?? 
        req.params?.orderRestaurantId ??
        null;
    
    const restaurantId = 
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

    const targetOrderId = orderId || order.order_id;
    const targetRestaurantId = restaurantId || order.restaurant_id;
    const targetOrderRestaurantId = orderRestaurantId || order.order_restaurant_id || order.id;

    const keysToDelete = [];
    if (targetRestaurantId) {
        keysToDelete.push(`restaurant:${targetRestaurantId}:order:${targetOrderId}`);
        keysToDelete.push(`restaurant:orders:${targetRestaurantId}`);
    }
    if (order.user_id) {
        keysToDelete.push(`user:${order.user_id}:order:${targetOrderId}`);
        keysToDelete.push(`user:orders:${order.user_id}`);
    }
    if (keysToDelete.length > 0) {
        await deleteMultipleCache({
            keys: keysToDelete
        });
    }

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
                    orderId: targetOrderId,
                    orderRestaurantId: targetOrderRestaurantId,
                    restaurantId: targetRestaurantId,
                    status,
                    totalAmount: order.total_amount,
                    userId: order?.user_id ?? null
                }
            });

            await publishEvent({
                topic: KAFKA_TOPICS.ORDER,
                key: targetOrderId,
                event: orderStatusUpdateEvent
            });
        }catch(kafkaError){
            console.error("[Kafka] Failed to publish order status update:", kafkaError.message);
        }
    }

    // Realtime notification to restaurant and user
    if(targetRestaurantId){
        emitRealtimeEvent({
            event: "order:status_updated",
            room: `restaurant:${targetRestaurantId}`,
            payload: {
                orderId: targetOrderId,
                orderRestaurantId: targetOrderRestaurantId,
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
                orderId: targetOrderId,
                orderRestaurantId: targetOrderRestaurantId,
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