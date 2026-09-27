import crypto from "node:crypto";


const createRestaurantEvent = ({
    eventData,
    eventType
}) => {

    if(!eventType){
        throw new Error(
            "eventType is required to build an restaurant service event"
        );
    }

    return{
        eventId: crypto.randomUUID(),
        eventType,
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: "restaurant-service",
        data: eventData
    };
};


export {
    createRestaurantEvent
};