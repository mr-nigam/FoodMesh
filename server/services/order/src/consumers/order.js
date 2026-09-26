import {
    createConsumer,
    subscribeConsumer,
    runConsumer,
    KAFKA_TOPICS,
    KAFKA_EVENTS
} from "@foodmesh/kafka";

import {
    orderStatusUpdateHandler
} from './handlers/orderStatusUpdateHandler.js';

import{
    deliveryUpdate
} from './handlers/deliveryHandler.js';

const consumer = createConsumer({
    groupId: "order-service",
    clientId: "order-service"
});

const startOrderConsumer = async() =>{
    await consumer.connect();

    await subscribeConsumer({
        consumer,
        topics: [
            KAFKA_TOPICS.ORDER,
            KAFKA_TOPICS.PAYMENT,
            KAFKA_TOPICS.DELIVERY
        ]
    });

    await runConsumer({
        consumer,
        handler: async({
            event
        })=>{

            const {
                eventType,
                data
            } = event;
            
            switch(eventType){
                case KAFKA_EVENTS.ORDER.RESTAURANT_STATUS_UPDATING:
                case KAFKA_EVENTS.ORDER.RESTAURANT_ORDER_REJECTED:
                    await orderStatusUpdateHandler(data);
                    break;
                
                case KAFKA_EVENTS.ORDER.RESTAURANT_ORDER_READY:
                    await orderStatusUpdateHandler(data);
                    break;

                case KAFKA_EVENTS.DELIVERY.RIDER_ASSIGNED:
                    await deliveryUpdate({
                        payload: data,
                        status: "rider_assigned"
                    });
                    break;

                case KAFKA_EVENTS.DELIVERY.PICKED_UP:
                    await deliveryUpdate({
                        payload: data,
                        status: "picked_up"
                    });
                    break;

                case KAFKA_EVENTS.DELIVERY.ON_THE_WAY:
                    await deliveryUpdate({
                        payload: data,
                        status: "rider_assigned"
                    });
                    break;
                
                case KAFKA_EVENTS.DELIVERY.DELIVERED:
                    await deliveryUpdate({
                        payload: data,
                        status: "delivered"
                    });
                    break;

                default:
                    console.log(`[Order Service] Unhandled event type: ${eventType}`);
                    break;
            }
        }
    });
};


export {
    startOrderConsumer
};