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

import { 
    fetchOrdersRepo,
    fetchOrderRepo,
    cancelOrderRepo
} from '../repositories/user.js';

import {
    emitRealtimeEvent
} from '../clients/realtime.js';


const fetchOrdersService = async({
    userId,
    query = {}
}) => {
    
    const page = Number(query.page) || 1;
    const limit = Math.min(
        Number(query.limit) || 50,
        100
    );

    const offset = (page - 1) * limit;

    const cacheKey = `user:orders:${userId}`;

    const cachedOrders = await getPaginatedList({
        key: cacheKey,
        page,
        limit
    });

    if(cachedOrders && cachedOrders.length !== 0){
        return cachedOrders;
    }

    const orders = await fetchOrdersRepo({
        userId,
        limit,
        offset
    });

    const ttl = 60*60;
    await cachePaginatedList({
        key: cacheKey,
        items: orders,
        ttl
    });

    return orders;
};

const fetchOrderService = async({
    userId,
    orderId
}) => {
     
    if(!orderId){
        throw new ApiError(
            400,
            "Please provide a valid order id"
        );
    }

    const cacheKey = `user:${userId}:order:${orderId}`;

    const cachedOrder = await getCache({
        key: cacheKey
    });

    if(cachedOrder){
        return cachedOrder;
    }

    const order = await fetchOrderRepo({
        userId,
        orderId
    });

    if(!order || order.length === 0){
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

const cancelOrderService = async({
    userId,
    orderId
})=>{

    if(!orderId){
        throw new ApiError(
            400,
            "Please provide a valid order id"
        );
    }

    const restaurantIds  = await cancelOrderRepo({
        orderId,
        userId
    });
    
    if(!restaurantIds || restaurantIds.length === 0){
        throw new ApiError(
            400,
            "fail to cancel the order"
        );
    }

    // Invalidate caches
    const keysToDelete = [
        `user:${userId}:order:${orderId}`,
        `user:orders:${userId}`
    ];

    for(const id of restaurantIds) {
        keysToDelete.push(`restaurant:${id}:order:${orderId}`);
        keysToDelete.push(`restaurant:orders:${id}`);
    }

    await deleteMultipleCache({ 
        keys: keysToDelete 
    });

    // put cancel order event in kafka
    try{
        const createOrderCancelEvent = createOrdersEvent({
            eventType: KAFKA_EVENTS.ORDER.CANCELLED,
            eventData:{
                orderId,
                userId
            }
        });

        await publishEvent({
            topic: KAFKA_TOPICS.ORDER,
            key: orderId,
            event: createOrderCancelEvent
        });
    }catch(kafkaError){
        console.error("[Kafka] Failed to publish order cancelled event:", kafkaError.message);
    }

    // emit this to user
    emitRealtimeEvent({
        event: "order:status_updated",
        room: `user:${userId}`,
        payload:{
            orderId,
            status: "cancelled"
        }
    });

    // emit cancel order to all restaurants
    for(const id of restaurantIds){
        emitRealtimeEvent({
            event: "order:status_updated",
            room: `restaurant:${id}`,
            payload:{
                orderId,
                status: "cancelled"
            }
        });
    }

    return orderId;
};


export {
    fetchOrdersService,
    fetchOrderService,
    cancelOrderService
};