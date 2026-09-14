const KAFKA_EVENTS = Object.freeze({
    ORDER: {
        CREATED: "order.created",
        CONFIRMED: "order.confirmed",
        CANCELLED: "order.cancelled",
        COMPLETED: "order.completed",

        ACCEPTED: "order.accepted",
        REJECTED: "order.rejected",
        PREPARING: "order.preparing",
        READY: "order.ready"
    },

    // RESTAURANT: {
    //     ACCEPTED: "order.accepted",
    //     REJECTED: "order.rejected",
    //     PREPARING: "order.preparing",
    //     READY: "order.ready"
    // },

    PAYMENT: {
        CREATED: "payment.created",
        SUCCESS: "payment.success",
        FAILED: "payment.failed",
        REFUNDED: "payment.refunded"
    },

    RIDER: {
        ASSIGNED: "rider.assigned",
        PICKED_UP: "rider.picked_up"
    },

    DELIVERY: {
        STARTED: "delivery.started",
        DELIVERED: "delivery.delivered"
    },

    REVIEW: {
        CREATED: "review.created"
    }
});


export {
    KAFKA_EVENTS
};