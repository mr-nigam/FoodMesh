import crypto from "node:crypto";


const createDeliveryEvent = ({
    eventData,
    eventType
}) => {

    if(!eventType){
        throw new Error(
            "eventType is required to build an delivery service event"
        );
    }

    return{
        eventId: crypto.randomUUID(),
        eventType,
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: "delivery-service",
        data: eventData
    };
};


export {
    createDeliveryEvent
};