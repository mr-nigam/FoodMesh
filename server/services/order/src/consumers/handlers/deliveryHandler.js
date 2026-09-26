import { 
    emitRealtimeEvent 
} from '../../clients/realtime.js';

import {
    deliveryUpdateService
} from '../../services/internal.js';

import{
    deleteOrderRelatedCache
} from '@foodmesh/redis';


const deliveryUpdate = async({
    payload,
    status
})=>{

    const eventData = payload?.eventData ?? payload;

    console.log("eventData: ",eventData);
    console.log("status: ",status);

    const {
        riderId,
        deliveryId,
        orderId,
        customerUserId,
        restaurantOrderId
    } = eventData;

    const order = await deliveryUpdateService({
        orderId,
        restaurantOrderId,
        status
    });

    // Notify the customer
    emitRealtimeEvent({
        event: "order:status_updated",
        room: `user:${customerUserId}`,
        payload: {
            deliveryId,
            orderId,
            status,
            riderId
        }
    }).catch(() => {});
    
    // Notify the restaurant
    emitRealtimeEvent({
        event: "order:status_updated",
        room: `user:${order.resturant_id}`,
        payload: {
            deliveryId,
            orderId,
            status,
            riderId,
            restaurantOrderId
        }
    }).catch(() => {});

    await deleteOrderRelatedCache({
        orderId,
        userId: customerUserId,
        resturantId: order.resturant_id,
        restaurantOrderId
    });

    return order;
};


export{
    deliveryUpdate
};