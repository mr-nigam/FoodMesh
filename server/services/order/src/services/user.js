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

    const cacheKey = `user:${userId}:orders`;

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

    const ttl = 900;
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

    const ttl = 900;
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

    const orderStatusCacheKey = `orderId:${orderId}:status`;
    const cachedStatus = await getCache({
        key: orderStatusCacheKey
    });

    if(
        cachedStatus && 
        (
            cachedStatus === "partially_delivered" ||
            cachedStatus === "delivered" ||
            cachedStatus === "cancelled" ||
            cachedStatus === "rejected" ||
            cachedStatus === "failed"
        )
    ){

        throw new ApiError(
            404,
            `Sorry you can't cancel the order as order status is already ${cachedStatus}`
        );
    }

    const restaurantIds  = await cancelOrderRepo({
        orderId,
        userId
    });
    
    if(!restaurantIds || restaurantIds.length === 0){
        throw new ApiError(
            400,
            "fail to cancel the order or already delivered/cancelled/failed/rejected"
        );
    }

    const createOrderCancelEvent = createOrdersEvent({
        eventType: KAFKA_EVENTS.ORDER.CANCELLED,
        eventData:{
            orderId,
            userId
        }
    });

    // Invalidate caches
    const keysToDelete = [
        `user:${userId}:order:${orderId}`,
        `user:${userId}:orders`
    ];

    const restaurantRealtimeTasks = [];

    for(const id of restaurantIds){
        keysToDelete.push(
            `restaurant:${id}:order:${orderId}`,
            `restaurant:${id}:orders`
        );

        restaurantRealtimeTasks.push(
            emitRealtimeEvent({
                event: "order:status_updated",
                room: `restaurant:${id}`,
                payload: {
                    orderId,
                    status: "cancelled"
                }
            })
        );
    }

    // emit this to user
    // put cancel order event in kafka
    // Remove existing caches from redis related to this event
    // store order state in redis
    const postCommitTasks = [
        emitRealtimeEvent({
            event: "order:status_updated",
            room: `user:${userId}`,
            payload: {
                orderId,
                status: "cancelled"
            }
        }),

        publishEvent({
            topic: KAFKA_TOPICS.ORDER,
            key: orderId,
            event: createOrderCancelEvent
        }),

        deleteMultipleCache({
            keys: keysToDelete
        }),

        setCache({
            key: orderStatusCacheKey,
            value: "cancelled",
            ttl: 900
        })
    ];

    await Promise.allSettled(postCommitTasks);
    await Promise.allSettled(restaurantRealtimeTasks);

    return orderId;
};


export {
    fetchOrdersService,
    fetchOrderService,
    cancelOrderService
};