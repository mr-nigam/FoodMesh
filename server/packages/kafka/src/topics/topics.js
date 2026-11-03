const KAFKA_TOPICS = Object.freeze({
    ADMIN: 
        "foodmesh.admin",

    ANALYTICS:
        "foodmesh.analytics",

    AUTH: 
        "foodmesh.auth",

    CART:
        "foodmesh.cart",
    
    DELIVERY:
        "foodmesh.delivery",

    NOTIFICATION:
        "foodmesh.notification",

    ORDER:
        "foodmesh.order",

    PAYMENT:
        "foodmesh.payment",
    
    REALTIME:
        "foodmesh.realtime",

    RESTAURANT:
        "foodmesh.restaurant",

    RIDER:
        "foodmesh.rider",

    RIDER_LOCATION:
        process.env.KAFKA_LOCATION_TOPIC || "foodmesh.rider.location",

    TRACKING:
        "foodmesh.tracking",

    REVIEW:
        "foodmesh.review",

    USER:
        "foodmesh.user"
});


export {
    KAFKA_TOPICS
};