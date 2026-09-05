import kafka from "../config/kafka.js";

let connected = false;


const producer = kafka.producer({

    allowAutoTopicCreation: false

});

const connectProducer = async () => {

    if (connected) {
        return;
    }

    await producer.connect();

    connected = true;

    console.log(
        "Kafka Producer connected"
    );
};

const disconnectProducer = async () => {

    if (!connected) {
        return;
    }

    await producer.disconnect();

    connected = false;

    console.log(
        "Kafka Producer disconnected"
    );
};

const publishEvent = async ({
    topic,
    key,
    event
}) => {

    if(!connected){
        throw new Error(
            "Kafka producer is not connected"
        );
    }

    if(!key){
        throw new Error(
            "Kafka message key is missing"
        );
    }

    await producer.send({
        topic,
        
        messages: [
            {
                key: String(key),
                value: JSON.stringify(event),

                headers: {
                    "event-type": event.eventType,
                    "event-version": String(event.eventVersion)
                }
            }
        ]
    });
};


export {
    connectProducer,
    disconnectProducer,
    publishEvent
}