import kafka from "../config/kafka.js";


const createConsumer = ({
    groupId
}) => {

    return kafka.consumer({
        groupId,
        allowAutoTopicCreation: false,
        sessionTimeout: 30000,
        rebalanceTimeout: 60000,
        heartbeatInterval: 3000
    });
};

const subscribeConsumer = async ({
    consumer,
    topics
}) => {

    for(const topic of topics){
        await consumer.subscribe({
            topic,
            fromBeginning: false
        });
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

            try {

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