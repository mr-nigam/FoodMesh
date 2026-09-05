import crypto from "node:crypto";
import { 
    KAFKA_EVENTS
} from './events.js';


const createOrderCreatedEvent = ({
    orderId,
    userId,
    restaurantId,
    totalAmount
}) => {

    return{
        eventId: crypto.randomUUID(),
        eventType: KAFKA_EVENTS.ORDER.CREATED,
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: "order-service",

        data: {
            orderId,
            userId,
            restaurantId,
            totalAmount
        }
    };
};

const createOrdersEvent = ({
    eventData,
    eventType
}) => {

    if(!eventType){
        throw new Error(
            "eventType is required to build an order event"
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
    createOrdersEvent,
    createOrderCreatedEvent
};