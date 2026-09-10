import {
    redis
} from '../config/redis.js';


const setGeoCache = async({
    key,
    longitude,
    latitude,
    restaurantId
})=>{

    const member = `${restaurantId}`;

    try{
        await redis.geoadd(
            key,
            Number(longitude),
            Number(latitude),
            String(member)
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


export {
    setGeoCache,
    geoSearch
}