import {
    createConsumer,
    subscribeConsumer,
    runConsumer,
    KAFKA_TOPICS,
    KAFKA_EVENTS
} from "@foodmesh/kafka";


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
                case KAFKA_EVENTS.ORDER.RESTAURANT_ORDER_READY:
                    await createDelievry(data);
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