import { redis } from "../config/redis.js";


const DEFAULT_LOCATION_TTL = Number(process.env.LOCATION_TTL) || 120;
const DEFAULT_STALE_THRESHOLD_MS = Number(process.env.LOCATION_STALE_THRESHOLD) || 60000;


const saveRiderLocation = async ({
    riderId,
    orderId,
    cityId,
    latitude,
    longitude,
    accuracy = null,
    speed = null,
    heading = null,
    timestamp = Date.now(),
    sequence = 1,
    ttl = DEFAULT_LOCATION_TTL
}) => {

    if(!riderId){
        throw new Error(
            "riderId is required to save location"
        );
    }

    const numLat = Number(latitude);
    const numLon = Number(longitude);
    const numTimestamp = Number(timestamp);
    const numSequence = Number(sequence);

    const locationKey = `rider:location:${riderId}`;
    const pipeline = redis.pipeline();

    const locationHash = {
        riderId: String(riderId),
        orderId: String(orderId || ""),
        latitude: String(numLat),
        longitude: String(numLon),
        accuracy: accuracy !== null && accuracy !== undefined ? String(accuracy) : "",
        speed: speed !== null && speed !== undefined ? String(speed) : "",
        heading: heading !== null && heading !== undefined ? String(heading) : "",
        timestamp: String(numTimestamp),
        sequence: String(numSequence),
        updatedAt: String(Date.now())
    };

    pipeline.hset(locationKey, locationHash);
    pipeline.expire(locationKey, ttl);

    if(cityId){
        const geoKey = `riders:geo:${cityId}`;
        const pingKey = `riders:last_ping:${cityId}`;

        pipeline.geoadd(geoKey, numLon, numLat, String(riderId));
        pipeline.zadd(pingKey, numTimestamp, String(riderId));
    }

    const results = await pipeline.exec();
    for(const [err] of results){
        if (err) throw err;
    }

    return true;
};

const getRiderLocation = async ({
    riderId,
    staleThresholdMs = DEFAULT_STALE_THRESHOLD_MS
}) => {

    if(!riderId) return null;

    const data = await redis.hgetall(`rider:location:${riderId}`);

    if(
        !data || 
        Object.keys(data).length === 0 || 
        !data.latitude || 
        !data.longitude
    ){
        return null;
    }

    const timestamp = Number(data.timestamp || data.updatedAt || Date.now());
    const ageMs = Math.max(0, Date.now() - timestamp);

    return {
        riderId: data.riderId,
        orderId: data.orderId || null,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        accuracy: data.accuracy ? Number(data.accuracy) : null,
        speed: data.speed ? Number(data.speed) : null,
        heading: data.heading ? Number(data.heading) : null,
        timestamp,
        sequence: Number(data.sequence || 1),
        ageMs,
        isFresh: ageMs < 30000,
        isDelayed: ageMs >= 30000 && ageMs < staleThresholdMs,
        isStale: ageMs >= staleThresholdMs
    };
};

const setOrderTracking = async ({
    orderId,
    riderId,
    customerId,
    deliveryId,
    cityId = "default",
    status = "accepted",
    ttl = 7200
}) => {

    if(!orderId || !riderId){
        throw new Error(
            "orderId and riderId are required for order tracking"
        );
    }

    const trackingKey = `tracking:order:${orderId}`;
    const trackingData = {
        orderId: String(orderId),
        riderId: String(riderId),
        customerId: String(customerId || ""),
        deliveryId: String(deliveryId || ""),
        cityId: String(cityId || "default"),
        status: String(status || "active"),
        assignedAt: String(Date.now())
    };

    const pipeline = redis.pipeline();
    pipeline.hset(trackingKey, trackingData);
    
    if(ttl > 0){
        pipeline.expire(trackingKey, ttl);
    }

    await pipeline.exec();

    return trackingData;
};

const getOrderTracking = async ({
    orderId
}) => {

    if(!orderId) return null;

    const data = await redis.hgetall(`tracking:order:${orderId}`);
    if(
        !data || 
        Object.keys(data).length === 0 || 
        !data.riderId
    ){
        return null;
    }

    return {
        orderId: data.orderId,
        riderId: data.riderId,
        customerId: data.customerId || null,
        deliveryId: data.deliveryId || null,
        cityId: data.cityId || "default",
        status: data.status || "active",
        assignedAt: Number(data.assignedAt || 0)
    };
};

const removeOrderTracking = async ({
    orderId,
    riderId,
    cityId
}) => {

    const pipeline = redis.pipeline();

    if(orderId){
        pipeline.del(`tracking:order:${orderId}`);
    }

    if(riderId){
        pipeline.del(`rider:location:${riderId}`);
        
        if(cityId){
            pipeline.zrem(`riders:geo:${cityId}`, String(riderId));
            pipeline.zrem(`riders:last_ping:${cityId}`, String(riderId));
        }
    }

    await pipeline.exec();

    return true;
};

const cleanStaleRidersFromGeo = async ({
    cityId,
    staleThresholdMs = DEFAULT_STALE_THRESHOLD_MS
}) => {

    if(!cityId) return 0;

    const geoKey = `riders:geo:${cityId}`;
    const pingKey = `riders:last_ping:${cityId}`;
    const cutoff = Date.now() - staleThresholdMs;

    const staleRiders = await redis.zrangebyscore(pingKey, "-inf", cutoff);
    
    if(
        !staleRiders || 
        staleRiders.length === 0
    ){
        return 0;
    }

    const pipeline = redis.pipeline();
    
    for(const riderId of staleRiders){
        pipeline.zrem(geoKey, riderId);
    }

    pipeline.zremrangebyscore(pingKey, "-inf", cutoff);

    await pipeline.exec();

    return staleRiders.length;
};


export {
    saveRiderLocation,
    getRiderLocation,
    setOrderTracking,
    getOrderTracking,
    removeOrderTracking,
    cleanStaleRidersFromGeo
};