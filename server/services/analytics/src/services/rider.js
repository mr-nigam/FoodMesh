import {
    ApiError
} from '@foodmesh/utils';

import {
    getCache,
    setCache
} from '@foodmesh/redis';

import {
    fetchRiderMetricsRepo
} from '../repositories/rider.js';


const fetchRiderMetricsService = async({
    riderId
})=>{

    if(!riderId){
        throw new ApiError(
            400,
            "Rider ID is required to fetch performance metrics"
        );
    }

    const cacheKey = `analytics:rider:${riderId}`;
    const cached = await getCache({ 
        key: cacheKey 
    });

    if(cached){
        return cached;
    }

    const metrics = await fetchRiderMetricsRepo({ 
        riderId 
    });

    if(metrics){
        await setCache({
            key: cacheKey,
            value: metrics,
            ttl: 300
        });
    }

    return metrics;
};


export {
    fetchRiderMetricsService
};
