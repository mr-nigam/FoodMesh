import '@foodmesh/utils/config/env';

const services = {
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:4001/api/v1/auth",
    user: process.env.USER_SERVICE_URL || "http://localhost:4002/api/v1/user",
    restaurant: process.env.RESTAURANT_SERVICE_URL || "http://localhost:4003/api/v1/restaurant",
    rider: process.env.RIDER_SERVICE_URL || "http://localhost:4004/api/v1/rider",
    cart: process.env.CART_SERVICE_URL || "http://localhost:4005/api/v1/cart",
    order: process.env.ORDER_SERVICE_URL || "http://localhost:4006/api/v1/order",
    payment: process.env.PAYMENT_SERVICE_URL || "http://localhost:4007/api/v1/payment",
    delivery: process.env.DELIVERY_SERVICE_URL || "http://localhost:4008/api/v1/delivery",
    notification: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4009/api/v1/notification",
    analytics: process.env.ANALYTICS_SERVICE_URL || "http://localhost:4010/api/v1/analytics",
    admin: process.env.ADMIN_SERVICE_URL || "http://localhost:4011/api/v1/admin",
    utils: process.env.UTILS_SERVICE_URL || "http://localhost:4012/api/v1/utils",
    realtime: process.env.REALTIME_SERVICE_URL || "http://localhost:5000"
};

export {
    services
};
