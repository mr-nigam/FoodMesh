import {
    redis
} from '../config/redis.js';


const setGeoCache = async({
    key,
    longitude,
    latitude,
    memberValue
})=>{

    if(!memberValue){
        console.error("setGeoCache: Missing member identifier (id/memberId/riderId/restaurantId)");
        return false;
    }

    try{
        await redis.geoadd(
            key,
            Number(longitude),
            Number(latitude),
            memberValue
        );

        return true;

    }catch(error){
        console.error(
            "Redis GEOADD failed:",
            error.message
        );

        return false;
    }
};

const geoSearch = async({
    key,
    longitude,
    latitude,
    radius = 5000
}) => { 

    try{
        return await redis.geosearch(
            key,
            'FROMLONLAT',
            Number(longitude),
            Number(latitude),
            'BYRADIUS',
            Number(radius),
            'm',
            'ASC',
            'WITHDIST',
            'COUNT',
            500
        );
        
    }catch(error){
        console.error(
            `[Redis GEOSEARCH Failed] key= ${key}`,
            error.message
        );

        return [];
    }
};

const deleteGeoCache = async({
    key,
    memberValue
})=>{
    
    if(!memberValue){
        return false;
    }

    try{
        await redis.zrem(key, memberValue);
        return true;

    }catch(error){
        console.log(`Failed to remove id: ${memberValue}`);
        return false;
    }
}

export {
    setGeoCache,
    geoSearch,
    deleteGeoCache
}