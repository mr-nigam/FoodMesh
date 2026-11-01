import kafka from "../config/kafka.js";
import { ensureTopicsExist } from "../admin/admin.js";


const createConsumer = ({
    groupId,
    clientId,
    allowAutoTopicCreation = true
}) => {

    return kafka.consumer({
        groupId,
        clientId,
        allowAutoTopicCreation,
        sessionTimeout: 30000,
        rebalanceTimeout: 60000,
        heartbeatInterval: 3000
    });
};

const subscribeConsumer = async ({
    consumer,
    topics
}) => {

    await ensureTopicsExist(topics);

    for (const topic of topics) {
        let retries = 5;
        while (retries > 0) {
            try {
                await consumer.subscribe({
                    topic,
                    fromBeginning: false
                });
                break;
            } catch (err) {
                if (err.type === 'UNKNOWN_TOPIC_OR_PARTITION' && retries > 1) {
                    retries--;
                    console.log(`[Kafka] Waiting for topic ${topic} to be available (${retries} retries left)...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    throw err;
                }
            }
        }
    }
};

const runConsumer = async ({
    consumer,
    handler
}) => {

    await consumer.run({

        eachMessage: async ({
            topic,
            partition,
            message
        }) => {
            
            const startedAt = Date.now();

            console.log(
                `[Kafka] Processing ${topic}[${partition}] offset=${message.offset}`
            );

            try{

                if(!message.value){
                    return;
                }

                const event =
                    JSON.parse(
                        message.value.toString()
                    );

                await handler({
                    topic,
                    partition,
                    message,
                    event
                });

            }catch(error){
                console.error(
                    "Kafka event processing failed:",
                    error
                );

                throw error;
            }
        }
    });
};


export{
    createConsumer,
    subscribeConsumer,
    runConsumer
};
