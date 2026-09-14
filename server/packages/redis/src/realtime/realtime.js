import 'dotenv/config';

import {
    createRedisConnection
} from "../config/redisFactory.js";


const realtimePublisher = createRedisConnection({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB ?? 0),

    name: "Redis Realtime Publisher",
});

const realtimeSubscriber = createRedisConnection({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB ?? 0),

    name: "Redis Realtime Subscriber",
});

const publish = async ({
    channel,
    message
}) => {

    try{
        if(!channel){
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

    }catch(error){
        console.error(
            `[Redis PUBLISH Failed] channel=${channel}`,
            error.message
        );

        return false;
    }
};

const channelCallbacks = new Map();
let isListenerAttached = false;

const attachGlobalMessageListener = () => {
    if(isListenerAttached) return;

    realtimeSubscriber.on("message", (receivedChannel, message) => {
        const callbacks = channelCallbacks.get(receivedChannel);
        if (!callbacks || callbacks.size === 0) return;

        let parsedMessage;
        try{
            parsedMessage = JSON.parse(message);
        }catch{
            parsedMessage = message;
        }

        callbacks.forEach((callback) => {
            try{
                callback(parsedMessage);
            }catch(cbError){
                console.error(`[Redis Callback Error] channel=${receivedChannel}:`, cbError.message);
            }
        });
    });

    isListenerAttached = true;
};

const subscribe = async ({
    channel,
    callback
}) => {
    try{
        if(!channel){
            throw new Error("Redis channel is required");
        }

        if(typeof callback !== "function"){
            throw new Error("Redis subscribe callback must be a function");
        }

        attachGlobalMessageListener();

        if(!channelCallbacks.has(channel)){
            channelCallbacks.set(channel, new Set());
            await realtimeSubscriber.subscribe(channel);
        }

        channelCallbacks.get(channel).add(callback);

        return true;
    }catch(error){
        console.error(
            `[Redis SUBSCRIBE Failed] channel=${channel}`,
            error.message
        );
        return false;
    }
};

const unsubscribe = async ({
    channel,
    callback
}) => {
    try{
        if(!channel){
            throw new Error("Redis channel is required");
        }

        if(callback && channelCallbacks.has(channel)){
            const callbacks = channelCallbacks.get(channel);
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                channelCallbacks.delete(channel);
                await realtimeSubscriber.unsubscribe(channel);
            }
        }else{
            channelCallbacks.delete(channel);
            await realtimeSubscriber.unsubscribe(channel);
        }

        return true;
    }catch(error){
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