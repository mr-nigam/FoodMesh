import crypto from "node:crypto";


const createOrdersEvent = ({
    eventData,
    eventType
}) => {

    if(!eventType){
        throw new Error(
            "eventType is required to build an order service event"
        );
    }

    return{
        eventId: crypto.randomUUID(),
        eventType,
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: "order-service",
        data: eventData
    };
};


export {
    createOrdersEvent
};