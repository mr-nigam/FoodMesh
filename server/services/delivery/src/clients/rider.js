import axios from 'axios';


const getNearbyRiders = async ({
    longitude,
    latitude,
    radius = 5000,
    limit = 40
}) => {

    const riderUrl = 
        process.env.RIDER_SERVICE_URL
        ?? "http://localhost:4007/api/v1/rider";

    try{
        const { data } = await axios.get(
            `${riderUrl}/internal/delivery/nearby`,
            {
                params: {
                    longitude,
                    latitude,
                    radius,
                    limit
                },
                headers: {
                    'x-service-name': 'delivery-service',
                    'x-service-key': process.env.DELIVERY_SERVICE_KEY || 'delivery_service_secret_123',
                },
                timeout: 3000
            }
        );

        const riders = data?.riders ?? data?.data?.riders ?? [];
        return riders;

    }catch(error){
        console.log(`Failed to fetch nearby rider`, error.message);
        return [];
    }
};

const fetchRidersByIds = async ({
    riderIds
}) => {

    if(!riderIds || riderIds.length === 0) return [];

    const riderUrl = 
        process.env.RIDER_SERVICE_URL
        ?? "http://localhost:4007/api/v1/rider";

    try {
        const { data } = await axios.post(
            `${riderUrl}/internal/batch`,
            { riderIds },
            {
                headers: {
                    'x-service-name': 'delivery-service',
                    'x-service-key': process.env.DELIVERY_SERVICE_KEY || 'delivery_service_secret_123',
                },
                timeout: 3000
            }
        );

        return data?.riders ?? data?.data?.riders ?? [];
    } catch (error) {
        console.log(`Failed to fetch riders by IDs`, error.message);
        return [];
    }
};


export {
    getNearbyRiders,
    fetchRidersByIds
};