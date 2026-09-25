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

            const {eventType, data } = event;
            
            switch(eventType){
                case KAFKA_EVENTS.ORDER.RESTAURANT_STATUS_UPDATING:
                case KAFKA_EVENTS.ORDER.RESTAURANT_ORDER_REJECTED:
                    await orderStatusUpdateHandler(data);
                    break;
                
                case KAFKA_EVENTS.ORDER.RESTAURANT_ORDER_READY:
                    await orderStatusUpdateHandler(data);
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