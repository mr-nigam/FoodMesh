import {
    createConsumer,
    subscribeConsumer,
    runConsumer,
    KAFKA_TOPICS,
    KAFKA_EVENTS
} from "@foodmesh/kafka";

import {
    handleOrderCreated
} from './handlers/orderCreated.js';


const consumer = createConsumer({
    groupId: "notification-service",
    clientId: "notification-service"
});

const startOrderConsumer = async() => {
    await consumer.connect();
    
    await subscribeConsumer({
        consumer,
        topics: [
            KAFKA_TOPICS.ORDER
        ]
    });

    await runConsumer({
        consumer,
        handler: async({
            event
        })=>{
            const {eventType, data} = event;

            switch(eventType){
                case KAFKA_EVENTS.ORDER.CREATED:
                    console.log("notification consumer");
                    await handleOrderCreated(data);
                    break;

                default:
                    console.log(`[Notification Service] Unhandled event type: ${eventType}`);
                    break;
            }
        }
    });
};


export{
    startOrderConsumer
};