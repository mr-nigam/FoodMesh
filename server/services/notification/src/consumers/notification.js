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

const startNotificationConsumer = async() => {
    await consumer.connect();
    
    await subscribeConsumer({
        consumer,
        topics: [
            KAFKA_TOPICS.ADMIN,
            KAFKA_TOPICS.ANALYTICS,
            KAFKA_TOPICS.AUTH,
            KAFKA_TOPICS.CART,
            KAFKA_TOPICS.DELIVERY,
            KAFKA_TOPICS.ORDER,
            KAFKA_TOPICS.PAYMENT,
            KAFKA_TOPICS.REALTIME,
            KAFKA_TOPICS.RESTAURANT,
            KAFKA_TOPICS.RIDER,
            KAFKA_TOPICS.RIDER_LOCATION,
            KAFKA_TOPICS.TRACKING,
            KAFKA_TOPICS.REVIEW,
            KAFKA_TOPICS.USER
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
    startNotificationConsumer
};