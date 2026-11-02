const services = {
    auth: process.env.AUTH_SERVICE_URL,

    restaurant: process.env.RESTAURANT_SERVICE_URL,
    cart: process.env.CART_SERVICE_URL,

    utils: process.env.UTILS_SERVICE_URL,
    user: process.env.USER_SERVICE_URL,

    order: process.env.ORDER_SERVICE_URL,
    rider: process.env.RIDER_SERVICE_URL,

    payment: process.env.PAYMENT_SERVICE_URL,

    analytics: process.env.ANALYTICS_SERVICE_URL,
    delivery: process.env.DELIVERY_SERVICE_URL,
    notification: process.env.NOTIFICATION_SERVICE_URL,

    realtime: process.env.REALTIME_SERVICE_URL,

    admin: process.env.ADMIN_SERVICE_URL
};


export{
    services
};