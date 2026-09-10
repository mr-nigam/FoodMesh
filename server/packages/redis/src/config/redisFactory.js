import Redis from "ioredis";


const createRedisConnection = ({
    host,
    port,
    password = undefined,
    db = 0,
    name = "Redis",

    retryStrategy = (times) => {
        return Math.min(times * 100, 3000);
    },

    maxRetriesPerRequest = 3,

    enableReadyCheck = true,

    reconnectOnError = (err) => {
        console.error(
            `❌ ${name} Reconnect Error:`,
            err.message
        );

        return true;
    },

    ...options
}) => {

    const redis = new Redis({
        host,
        port,
        password,
        db,

        connectionName: name,

        retryStrategy,
        maxRetriesPerRequest,
        enableReadyCheck,
        reconnectOnError,

        ...options,
    });


    redis.on("connect", () => {
        console.log(`🔌 ${name} Connecting`);
    });


    redis.on("ready", () => {
        console.log(`✅ ${name} Ready`);
    });


    redis.on("error", (err) => {
        console.error(
            `❌ ${name} Error:`,
            err.message
        );
    });


    redis.on("close", () => {
        console.warn(
            `⚠️ ${name} Connection Closed`
        );
    });


    redis.on("reconnecting", (delay) => {
        console.warn(
            `🔄 ${name} Reconnecting in ${delay}ms`
        );
    });


    return redis;
};


export {
    createRedisConnection
};