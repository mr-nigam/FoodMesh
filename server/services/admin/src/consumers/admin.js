import {
    createConsumer,
    subscribeConsumer,
    runConsumer,
    KAFKA_TOPICS,
    KAFKA_EVENTS
} from '@foodmesh/kafka';


const consumer = createConsumer({
    groupId: "admin-service",
    clientId: "admin-service"
});


const startAdminConsumer = async() => {

    await consumer.connect();

    await subscribeConsumer({
        consumer,
        topics: [
            KAFKA_TOPICS.USER,
            KAFKA_TOPICS.RIDER,
            KAFKA_TOPICS.RESTAURANT
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

                default:
                    console.log(`[Admin Service] Unhandled event type: ${eventType}`);
                    break;
            }
        }
    });
};


export {
    startAdminConsumer
}