import {
    redis
} from '../config/redis.js';


const setCache = async({
    key,
    value,
    ttl = 600
}) => {

    try{
        await redis.set(
            key,
            JSON.stringify(value),
            'EX',
            ttl
        );

        return true;
    }catch(error){

        console.error("Redis SET failed:", error.message);
        return false;
    }
};

const getCache = async({
    key
}) =>{

    try{
        const data = await redis.get(
            key
        );

        return data ? JSON.parse(data) : null;

    }catch(error){
        console.error("Redis GET failed:", error.message);
        return null;
    }
};

const deleteCache = async({
    key
})=>{

    try{
        await redis.del(key);
        return true;
    }catch(error){
        console.error("Redis GET failed:", error.message);
        return false;
    }

};

const deleteMultipleCache = async({
    keys
}) => {

    if(!keys)return 0;

    try{
        const keyArray = Array.isArray(keys) ? keys : [keys];

        if(keyArray.length === 0) return 0;

        const deletedCount = await redis.del(...keyArray);

        return deletedCount;
        
    }catch(err){
        console.error("Redis DEL failed:", err.message);
        return 0;
    }
};

const cachePaginatedList = async({
    key,
    items,
    ttl = 300
}) => {

    if(!items.length){
        return;
    }

    const serializedList = items.map(
        item => JSON.stringify(item)
    );

    const pipeline = redis.pipeline();

    pipeline.del(key);

    pipeline.rpush(
        key,
        ...serializedList
    );

    pipeline.expire(
        key,
        ttl
    );

    await pipeline.exec();
};

const getPaginatedList = async({
    key,
    page,
    limit
}) => {

    const start = (page-1)*limit;
    const end = start+limit-1;

    const pipeline = redis.pipeline();

    pipeline.lrange(
        key,
        start,
        end,
    );

    pipeline.llen(key);

    const results =  await pipeline.exec();

    const serializedItems = results[0][1] || [];

    const items = serializedItems.map(
        item => JSON.parse(item)
    );

    return items;
};

const deleteOrderRelatedCache = async({
    userId = null,
    restaurantId = null,
    riderId = null,
    orderId = null,
    restauranOrderId = null,
    deliveryId = null
})=>{

    
    const keysToDelete = [];

    if(userId){
        keysToDelete.push(
            `user:${userId}:orders`
        );

        if(orderId){
            keysToDelete.push(
                `user:${userId}:order:${orderId}`
            );
        }
    }

    if(restaurantId){
        keysToDelete.push(
            `restaurant:${restaurantId}:orders`
        );

        if(orderId){
            keysToDelete.push(
                `restaurant:${restaurantId}:order:${orderId}`
            );
        }

        if(restauranOrderId){
            keysToDelete.push(
                `restaurant:${restaurantId}:restaurantOrder:${restauranOrderId}`
            );
        }
    }

    if(orderId){
        keysToDelete.push(
            `orderId:${orderId}:status`
        );
    }

    if(riderId){
        keysToDelete.push(
            `rider:${riderId}:deliveries`
        );

        if(deliveryId){
            keysToDelete.push(
                `rider:${riderId}:delivery:${deliveryId}`
            );
        }   
    }

    if(orderId && restauranOrderId){
        keysToDelete.push(
            `delivery:order:${orderId}:restaurantOrder:${restauranOrderId}`
        );
    }

    if(keysToDelete.length > 0){
        await deleteMultipleCache({
            keys: keysToDelete
        });
    }

    return true;
};


export{
    setCache,
    getCache,
    deleteCache,
    deleteMultipleCache,
    cachePaginatedList,
    getPaginatedList,
    deleteOrderRelatedCache
};