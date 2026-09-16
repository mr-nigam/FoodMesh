import crypto from "node:crypto";


const createRiderEvent = ({
    eventData,
    eventType
}) => {

    if(!eventType){
        throw new Error(
            "eventType is required to build an rider service event"
        );
    }

    return{
        eventId: crypto.randomUUID(),
        eventType,
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: "rider-service",
        data: eventData
    };
};


export {
    createRiderEvent
};