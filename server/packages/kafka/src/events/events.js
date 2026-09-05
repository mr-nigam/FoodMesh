const KAFKA_EVENTS = Object.freeze({
    ORDER: {
        CREATED: "order.created",
        CONFIRMED: "order.confirmed",
        CANCELLED: "order.cancelled",
        COMPLETED: "order.completed"
    },

    PAYMENT: {
        CREATED: "payment.created",
        SUCCESS: "payment.success",
        FAILED: "payment.failed",
        REFUNDED: "payment.refunded"
    },

    RESTAURANT: {
        ORDER_ACCEPTED: "restaurant.order.accepted",
        ORDER_REJECTED: "restaurant.order.rejected",
        ORDER_PREPARING: "restaurant.order.preparing",
        ORDER_READY: "restaurant.order.ready"
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