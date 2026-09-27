import {
    createConsumer,
    subscribeConsumer,
    runConsumer,
    KAFKA_TOPICS,
    KAFKA_EVENTS
} from "@foodmesh/kafka";

import {
    orderStatusUpdateHandler
} from './handlers/orderHandler.js';


const consumer = createConsumer({
    groupId: "restaurant-service",
    clientId: "restaurant-service"
});

const startRestaurantConsumer = async() =>{
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
                case KAFKA_EVENTS.RESTAURANT.ORDER_UPDATES:
                    await orderStatusUpdateHandler({
                        payload: data
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
    startRestaurantConsumer
};