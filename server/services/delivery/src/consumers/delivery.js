import {
    createConsumer,
    subscribeConsumer,
    runConsumer,
    KAFKA_TOPICS,
    KAFKA_EVENTS
} from "@foodmesh/kafka";

import {
    createDelivery
} from './handlers/createDelivery.js';

import {
    appointRider
} from './handlers/appointRider.js'


const consumer = createConsumer({
    groupId: "delivery-service",
    clientId: "delivery-service"
});

const startOrderConsumer = async() =>{
    await consumer.connect();

    await subscribeConsumer({
        consumer,
        topics: [
            KAFKA_TOPICS.ORDER,
            KAFKA_TOPICS.PAYMENT,
            KAFKA_TOPICS.RIDER,
            KAFKA_TOPICS.RESTAURANT,
        ]
    });

    await runConsumer({
        consumer,
        handler: async({
            event
        })=>{

            const {eventType, data }= event;
            
            switch(eventType){
                case KAFKA_EVENTS.ORDER.RESTAURANT_STATUS_UPDATING:
                    await createDelivery({
                        payload: data
                    });
                    break;

                case KAFKA_EVENTS.ORDER.RESTAURANT_ORDER_READY:
                    await appointRider({
                       payload: data
                    });
                    break;
                    
                default:
                    console.log(`[Delivery Service] Unhandled event type: ${eventType}`);
                    break;
            }
        }
    });
};


export {
    startOrderConsumer
};