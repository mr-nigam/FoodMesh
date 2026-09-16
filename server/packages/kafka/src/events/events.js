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

    PAYMENT: {
        CREATED: "payment.created",
        SUCCESS: "payment.success",
        FAILED: "payment.failed",
        REFUNDED: "payment.refunded"
    },

    DELIVERY: {
        RIDER_ASSIGNED: "rider.rider_assigned",
        PICKED_UP: "delivery.picked_up",
        STARTED: "delivery.started",
        DELIVERED: "delivery.delivered"
    },

    RIDER: {
        CREATED: "rider.created",
        UPDATED: "rider.updated",

        ACTIVATED: "rider.activated",
        DEACTIVATED: "rider.deactivated",

        ONLINE: "rider.online",
        OFFLINE: "rider.offline",

        LOCATION_UPDATED: "rider.location_updated",

        DOCUMENTS_UPDATED: "rider.documents_updated",
        VERIFIED: "rider.verified",
        SUSPENDED: "rider.suspended",

        PROFILE_UPDATED: "rider.profile_updated"
    },

    RESTAURANT: {
        CREATED: "restaurant.created",
        UPDATED: "restaurant.updated",

        ACTIVATED: "restaurant.activated",
        DEACTIVATED: "restaurant.deactivated",

        OPENED: "restaurant.opened",
        CLOSED: "restaurant.closed",

        PROFILE_UPDATED: "restaurant.profile_updated",

        LOCATION_UPDATED: "restaurant.location_updated",

        TIMINGS_UPDATED: "restaurant.timings_updated",

        MENU_UPDATED: "restaurant.menu_updated",

        ITEM_CREATED: "restaurant.item_created",
        ITEM_UPDATED: "restaurant.item_updated",
        ITEM_DELETED: "restaurant.item_deleted",

        VERIFIED: "restaurant.verified",
        SUSPENDED: "restaurant.suspended"
    },

    USER: {
        CREATED: "user.created",
        UPDATED: "user.updated",

        PROFILE_UPDATED: "user.profile_updated",

        PHONE_UPDATED: "user.phone_updated",
        EMAIL_UPDATED: "user.email_updated",

        PASSWORD_CHANGED: "user.password_changed",

        ADDRESS_ADDED: "user.address_added",
        ADDRESS_UPDATED: "user.address_updated",
        ADDRESS_DELETED: "user.address_deleted",

        ACTIVATED: "user.activated",
        DEACTIVATED: "user.deactivated",

        BLOCKED: "user.blocked",
        UNBLOCKED: "user.unblocked"
    },

    REVIEW: {
        CREATED: "review.created"
    }
});


export {
    KAFKA_EVENTS
};