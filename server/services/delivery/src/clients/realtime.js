import axios from 'axios';


const emitRealtimeEvent = async ({
    event,
    room,
    payload
}) => {
    try{
        const realtimeUrl = process.env.REALTIME_SERVICE_URL || 'http://localhost:4009';

        await axios.post(
            `${realtimeUrl}/internal/emit`,
            {
                event,
                room,
                payload: payload ?? {}
            },
            {
                headers: {
                    'x-service-name': 'delivery-service',
                    'x-service-key': process.env.DELIVERY_SERVICE_KEY || 'delivery_service_secret_123',
                },
                timeout: 3000,
            }
        );

        return true;
        
    }catch(error){
        console.error(
            `[Realtime Client] Failed to emit event "${event}" to room "${room}":`,
            error.message
        );

        return false;
    }
};


export {
    emitRealtimeEvent
};
