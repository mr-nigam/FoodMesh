import { 
    ApiError
} from "@foodmesh/utils";

// In-memory token bucket per rider
const riderLastRequestTime = new Map();
const MIN_REQUEST_INTERVAL_MS = 1500; // Allow at most 1 update per 1.5 seconds


const createTrackingRateLimiter = ({ minIntervalMs = 1500 } = {}) => {
    const riderLastRequestTime = new Map();

    return (req, res, next) => {
        const riderId = req.user?.riderId || req.user?.id;
        if(!riderId){
            return next();
        }

        const now = Date.now();
        const lastTime = riderLastRequestTime.get(riderId);

        if(
            lastTime && 
            (now - lastTime) < minIntervalMs
        ){
            return next(
                new ApiError(
                    429,
                    "Too Many Requests: Rate limit exceeded for location updates."
                )
            );
        }

        riderLastRequestTime.set(riderId, now);

        // Periodic cleanup of stale memory records every 5000 items
        if(riderLastRequestTime.size > 5000){

            const staleCutoff = now - 60000;
            
            for(const [key, time] of riderLastRequestTime.entries()){
                
                if(time < staleCutoff){
                    riderLastRequestTime.delete(key);
                }
            }
        }

        next();
    };
};

const trackingRateLimiter = createTrackingRateLimiter({ minIntervalMs: 1500 });


export {
    trackingRateLimiter,
    createTrackingRateLimiter
};