import crypto from "node:crypto";
import { KAFKA_EVENTS } from "./events.js";


const createLocationEvent = ({
    orderId,
    riderId,
    latitude,
    longitude,
    accuracy = null,
    speed = null,
    heading = null,
    timestamp = Date.now(),
    sequence = 1,
    eventId = crypto.randomUUID()
}) => {
    
    return {
        eventId,
        eventType: KAFKA_EVENTS.RIDER.LOCATION_UPDATED,
        eventVersion: 1,
        occurredAt: new Date(timestamp).toISOString(),
        producer: "delivery-service",

        data: {
            eventId,
            orderId,
            riderId,
            latitude: Number(latitude),
            longitude: Number(longitude),
            accuracy: accuracy !== null && accuracy !== undefined ? Number(accuracy) : null,
            speed: speed !== null && speed !== undefined ? Number(speed) : null,
            heading: heading !== null && heading !== undefined ? Number(heading) : null,
            timestamp: Number(timestamp),
            sequence: Number(sequence)
        }
    };
};


export {
    createLocationEvent
};