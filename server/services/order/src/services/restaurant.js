import {
    ApiError
} from '@foodmesh/utils';


// import {

// } from '@foodmesh/redis';

import{
    fetchOrdersRepo,
    fetchOrderRepo,
    updateOrderStatusRepo
} from '../repositories/restaurant.js';

import {
    publishEvent,
    KAFKA_TOPICS,
    KAFKA_EVENTS,
    createOrdersEvent
} from "@foodmesh/kafka";

import { 
    emitRealtimeEvent 
} from '../clients/realtime.client.js';


const ALLOWED_ORDER_STATUS_FOR_UPDATE = [
    'accepted',
    'preparing',
    'ready',
    'rejected',
    'cancelled'
];


const fetchOrdersService = async({
    req,
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
    
    const orders = await fetchOrdersRepo({
        restaurantId,
        limit,
        offset
    });

    return orders;
};

const fetchOrderService = async({
    req
}) => {

    const restaurantId = 
        req?.params?.restaurantId ??
        req?.user?.restaurantId ??
        req?.body?.restaurantId ??
        null;
    
    let orderId = req.params?.orderId ?? req.params?.id ?? null;
    if (orderId && typeof orderId === 'string') {
        orderId = orderId.replace(/^:/, '');
    }
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

    return order;
};

// check it again
const updateOrderStatusService = async({
    req
}) => {

    const rawStatus = 
        req.body?.status?.trim() 
        ?? req.body?.orderStatus?.trim();

    if(!rawStatus){
        throw new ApiError(
            400,
            "Status is required"
        );
    }

    const status = rawStatus.toLowerCase();

    if(!ALLOWED_ORDER_STATUS_FOR_UPDATE.includes(status)){
        throw new ApiError(
            400,
            `Invalid status "${rawStatus}". Allowed statuses: ${ALLOWED_ORDER_STATUS_FOR_UPDATE.join(", ")}`
        );
    }

    let orderId = req.params?.orderId ?? req.params?.id ?? req.body?.orderId ?? null;
    if(orderId && typeof orderId === 'string'){
        orderId = orderId.replace(/^:/, '');
    }

    const orderRestaurantId = 
        req.params?.orderRestaurantId ?? 
        req.body?.orderRestaurantId ?? 
        null;
    
    const restaurantId = 
        req.body?.restaurantId ?? 
        req.params?.restaurantId ?? 
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

    const targetOrderId = order.order_id || orderId;
    const targetOrderRestaurantId = order.id || orderRestaurantId;
    const targetRestaurantId = order.restaurant_id || restaurantId;

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
    }else if(upperStatus === 'CANCELLED'){
        eventType = KAFKA_EVENTS.ORDER.CANCELLED;
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
                    userId: order.user_id
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