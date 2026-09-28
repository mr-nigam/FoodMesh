import { 
    emitRealtimeEvent 
} from '../../clients/realtime.js';

import {
    getRestaurantData
} from '../../clients/restaurant.js';

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

    await deleteOrderRelatedCache({
        orderId,
        userId: customerUserId,
        restaurantId: order?.restaurant_id,
        restaurantOrderId
    }).catch(() => {});

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
    try {
        if (order?.restaurant_id) {
            const restaurant = await getRestaurantData({
                restaurantId: order.restaurant_id  
            });
            
            if (restaurant?.user_id) {
                emitRealtimeEvent({
                    event: "order:status_updated",
                    room: `user:${restaurant.user_id}`,
                    payload: {
                        deliveryId,
                        orderId,
                        status,
                        riderId,
                        restaurantOrderId
                    }
                }).catch(() => {});
            }
        }
    } catch (rErr) {
        console.warn("[deliveryHandler] Failed to notify restaurant:", rErr?.message || rErr);
    }


    return order;
};


export{
    deliveryUpdate
};