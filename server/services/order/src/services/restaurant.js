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
    updateRestaurantOrderStatusRepo
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
    
    const cacheKey = `restaurant:${restaurantId}:orders`;

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

const updateRestaurantOrderStatusService = async({
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

    const restaurantId = 
        req.user?.restaurantId ?? 
        null;

    const orderId = 
        req.params?.orderId ??
        null;
  
    const orderRestaurantId = 
        req.body?.orderRestaurantId ?? 
        req.params?.orderRestaurantId ??
        null;

    if(!orderId && !orderRestaurantId){
        throw new ApiError(
            400,
            "Please provide orderId or orderRestaurantId"
        );
    }

    const order = await updateRestaurantOrderStatusRepo({
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

    await deleteMultipleCache({
        keys: [
            `restaurant:${restaurantId}:order:${orderId}`,
            `restaurant:${restaurantId}:orders`   
        ]
    });

    let eventType = null;
    const upperStatus = status.toUpperCase();
    if(
        upperStatus === 'ACCEPTED' ||
        upperStatus === 'REJECTED' ||
        upperStatus === 'PREPARING'
    ){
        eventType = KAFKA_EVENTS.ORDER.RESTAURANT_STATUS_UPDATING;

    }else if(upperStatus === 'READY'){
        eventType = KAFKA_EVENTS.ORDER.RESTAURANT_ORDER_READY;
    }

    if(eventType){
        try{
            const restaurantOrderStatusUpdateEvent = createOrdersEvent({
                eventType,
                eventData: {
                    orderId,
                    orderRestaurantId,
                    restaurantId,
                    userId: order?.user_id
                }
            });

            await publishEvent({
                topic: KAFKA_TOPICS.ORDER,
                key: orderId,
                event: restaurantOrderStatusUpdateEvent
            });
        }catch(kafkaError){
            console.error(
                "[Kafka] Failed to publish order status update:", 
                kafkaError.message
            );
        }
    }

    // Realtime notification to restaurant
    emitRealtimeEvent({
        event: "order:status_updated",
        room: `restaurant:${restaurantId}`,
        payload: {
            orderId,
            orderRestaurantId,
            status
        }
    });
    

    return order;
};


export{
    fetchOrdersService,
    fetchOrderService,
    updateRestaurantOrderStatusService
};