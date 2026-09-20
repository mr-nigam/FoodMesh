import {
    updateOrderStatusService
} from '../../services/internal.js';

import { 
    emitRealtimeEvent 
} from '../../clients/realtime.js';

import {
    deleteMultipleCache
} from '@foodmesh/redis';


const orderStatusUpdateHandler = async(payload)=>{
    console.log("orderStatusUpdateHandler-1");

    const eventData = payload?.eventData || payload;

    if(
        !eventData || 
        !eventData.orderId
    ){
        console.error("[Payment Service] Invalid event payload received:", payload);
        return null;
    }

    const { 
        orderId,
        userId
    } = eventData;

    const order = await updateOrderStatusService({
        orderId
    });

    if(userId){
        emitRealtimeEvent({
            event: "order:status_updated",
            room: `user:${userId}`,
            payload: {
                orderId,
                status: order.status
            }
        });
    }
    
    await deleteMultipleCache({
        keys: [
            `user:${userId}:order:${orderId}`,
            `user:${userId}:orders`
        ]
    });

    console.log("orderStatusUpdateHandler-2");
    return order;
};


export {
    orderStatusUpdateHandler
};