import crypto from 'node:crypto';


const createPaymentEvent = ({
    eventData,
    eventType
})=>{
    if(!eventType){
        throw new Error(
            "eventType is required to build an payment event"
        );
    }

    return {
        eventId: crypto.randomUUID(),
        eventType,
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: "payment-service",
        data: eventData
    }
};


export {
    createPaymentEvent
};