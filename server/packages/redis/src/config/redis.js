import 'dotenv/config';
import {
    createRedisConnection
} from './redisFactory.js';


const redis = createRedisConnection({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB ?? 0),
    name: "FoodMesh Redis"
});


export {
    redis
};