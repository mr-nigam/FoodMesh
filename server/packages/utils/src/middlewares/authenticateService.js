const currentServiceKeys = {
    "order-service": process.env.ORDER_SERVICE_KEY,
    "restaurant-service": process.env.RESTAURANT_SERVICE_KEY,
    "cart-service": process.env.CART_SERVICE_KEY,
    "rider-service": process.env.RIDER_SERVICE_KEY,
    "payment-service": process.env.PAYMENT_SERVICE_KEY,
    "user-service": process.env.USER_SERVICE_KEY
};

const authenticateService = (req, res, next) => {
    const serviceName = req.headers["x-service-name"];
    const serviceKey = req.headers["x-service-key"];

    if(!serviceName || !serviceKey){
        return res
            .status(401)
            .json({
                message: "Unauthorized service: Missing x-service-name or x-service-key header"
            });
    }

    const expectedKey = currentServiceKeys[serviceName];

    if(
        !expectedKey || 
        expectedKey !== serviceKey
    ){
        console.warn(
            `[Auth] Service auth failed for ${serviceName}. 
            Expected key present: ${Boolean(expectedKey)}`
        );

        return res
            .status(401)
            .json({
                message: "Unauthorized service: Invalid or unconfigured service key"
            });
    }

    req.service = serviceName;

    next();
};


export {
    authenticateService
};