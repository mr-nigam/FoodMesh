import 'dotenv/config';

import {
    createRedisConnection
} from "../config/redisFactory.js";


const realtimePublisher = createRedisConnection({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password:
        process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB ?? 0),

    name: "Redis Realtime Publisher",
});

const realtimeSubscriber = createRedisConnection({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password:
        process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB ?? 0),

    name: "Redis Realtime Subscriber",
});

const publish = async ({
    channel,
    message
}) => {

    try {

        if (!channel) {
            throw new Error(
                "Redis channel is required"
            );
        }

        const serializedMessage =
            typeof message === "string"
                ? message
                : JSON.stringify(message);

        await realtimePublisher.publish(
            channel,
            serializedMessage
        );

        return true;

    } catch (error) {

        console.error(
            `[Redis PUBLISH Failed] channel=${channel}`,
            error.message
        );

        return false;
    }
};

const subscribe = async ({
    channel,
    callback
}) => {

    try {

        if (!channel) {
            throw new Error(
                "Redis channel is required"
            );
        }

        if (typeof callback !== "function") {
            throw new Error(
                "Redis subscribe callback must be a function"
            );
        }


        await realtimeSubscriber.subscribe(
            channel
        );


        const messageHandler = (
            receivedChannel,
            message
        ) => {

            if (
                receivedChannel !== channel
            ) {
                return;
            }

            let parsedMessage;

            try {

                parsedMessage =
                    JSON.parse(message);

            } catch {

                parsedMessage = message;
            }

            callback(
                parsedMessage
            );
        };


        realtimeSubscriber.on(
            "message",
            messageHandler
        );


        return true;

    } catch (error) {

        console.error(
            `[Redis SUBSCRIBE Failed] channel=${channel}`,
            error.message
        );

        return false;
    }
};

const unsubscribe = async ({
    channel
}) => {

    try {

        if (!channel) {
            throw new Error(
                "Redis channel is required"
            );
        }

        await realtimeSubscriber.unsubscribe(
            channel
        );

        return true;

    } catch (error) {

        console.error(
            `[Redis UNSUBSCRIBE Failed] channel=${channel}`,
            error.message
        );

        return false;
    }
};


export {
    publish,
    subscribe,
    unsubscribe
};