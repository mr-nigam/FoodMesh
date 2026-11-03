import { 
    publishEvent,
    KAFKA_TOPICS
} from "@foodmesh/kafka";

const retryQueue = [];
let isProcessingQueue = false;


const processRetryQueue = async () => {
    if (isProcessingQueue || retryQueue.length === 0) return;
    isProcessingQueue = true;

    while (retryQueue.length > 0) {
        const item = retryQueue[0];
        try {
            await publishEvent({
                topic: item.topic,
                key: item.key,
                event: item.event
            });
            retryQueue.shift();
        } catch (err) {
            item.retries = (item.retries || 0) + 1;
            console.warn(`[Kafka Tracking Outbox] Retry failed (${item.retries}/5): ${err.message}`);
            if (item.retries >= 5) {
                console.error(`[Kafka Tracking Outbox] Discarding event after 5 failed retries: eventId=${item.event?.eventId}`);
                retryQueue.shift();
            } else {
                // Wait 2 seconds before next retry attempt
                await new Promise((r) => setTimeout(r, 2000));
            }
        }
    }

    isProcessingQueue = false;
};

const sendLocationEventToKafka = async ({ event, key }) => {
    const topic = KAFKA_TOPICS.RIDER_LOCATION || "foodmesh.rider.location";

    try {
        await publishEvent({
            topic,
            key: String(key),
            event
        });
    } catch (error) {
        console.warn(`[Kafka Tracking] Initial publish failed, enqueuing for retry: ${error.message}`);
        retryQueue.push({
            topic,
            key: String(key),
            event,
            retries: 0,
            enqueuedAt: Date.now()
        });

        // Trigger asynchronous processing
        setImmediate(processRetryQueue);
    }
};


export {
    sendLocationEventToKafka
};