import {
    createConsumer,
    subscribeConsumer,
    runConsumer,
    KAFKA_TOPICS,
    KAFKA_EVENTS
} from "@foodmesh/kafka";

import {
    professionalAccountCreated
} from './handlers/auth.js';


const consumer = createConsumer({
    groupId: "auth-service",
    clientId: "auth-service"
});

const startAuthConsumer = async () => {

    await consumer.connect();

    await subscribeConsumer({
        consumer,
        topics: [
            KAFKA_TOPICS.RESTAURANT,
            KAFKA_TOPICS.RIDER
        ]
    });

    await runConsumer({
        consumer,

        handler: async ({ 
            event
        }) => {

            const { eventType, data } = event;

            switch (eventType) {

                case KAFKA_EVENTS.RESTAURANT.CREATED:
                    await professionalAccountCreated(data);
                    break;

                case KAFKA_EVENTS.RIDER.CREATED:
                    await professionalAccountCreated(data);
                    break;

                default:
                    console.log(
                        `[Auth Service] Unhandled event type: ${eventType}`
                    );
                    break;
            }
        }
    });
};


export {
    startAuthConsumer
};