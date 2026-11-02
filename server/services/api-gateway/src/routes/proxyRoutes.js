import express from "express";
import { 
    createProxyMiddleware,
    fixRequestBody
} from "http-proxy-middleware";

import { services } from "../config/services.js";

const router = express.Router();

const getTargetOrigin = (urlStr) => {
    try {
        return new URL(urlStr).origin;
    } catch {
        return urlStr;
    }
};


const createServiceProxy = (serviceUrl, customPathRewrite) => {
    const targetOrigin = getTargetOrigin(serviceUrl);

    return createProxyMiddleware({
        target: targetOrigin,
        changeOrigin: true,
        xfwd: true,
        pathRewrite: customPathRewrite || ((path, req) => req.originalUrl),
        on: {
            error: (err, req, res) => {
                console.error(`[GATEWAY] Proxy Error: ${req.method} ${req.originalUrl} -> ${targetOrigin}: ${err.message}`);
                if (!res.headersSent) {
                    res.writeHead(502, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        success: false,
                        message: `Service at ${targetOrigin} is unavailable`,
                        error: err.message
                    }));
                }
            },
            proxyReq: (proxyReq, req, res) => {
                proxyReq.setHeader("x-gateway-request", "foodmesh-gateway");
                fixRequestBody(proxyReq, req);
            }
        }
    });
};

// Auth -> http://localhost:4001
router.use("/auth", createServiceProxy(services.auth));

// Restaurant -> http://localhost:4003 (handles /api/v1/restaurant/* and /api/v1/restaurant/cart/*)
router.use("/restaurant", createServiceProxy(services.restaurant));

// Cart -> if dedicated cart service on 4005, forward /api/v1/cart.
// If separate service isn't running, forward /api/v1/cart to restaurant service as /api/v1/restaurant/cart
router.use("/cart", createServiceProxy(services.cart || services.restaurant, (path, req) => {
    if (services.cart && services.cart.includes(":4005")) {
        return req.originalUrl;
    }
    return req.originalUrl.replace(/^\/api\/v1\/cart/, "/api/v1/restaurant/cart");
}));

// Utils -> http://localhost:4012
router.use("/utils", createServiceProxy(services.utils));

// User -> http://localhost:4002
router.use("/user", createServiceProxy(services.user));

// Order -> http://localhost:4006
router.use("/order", createServiceProxy(services.order));

// Rider -> http://localhost:4004
router.use("/rider", createServiceProxy(services.rider));

// Payment -> http://localhost:4007
router.use("/payment", createServiceProxy(services.payment));

// Analytics -> http://localhost:4010
router.use("/analytics", createServiceProxy(services.analytics));

// Delivery -> http://localhost:4008
router.use("/delivery", createServiceProxy(services.delivery));

// Notification -> http://localhost:4009
router.use("/notification", createServiceProxy(services.notification));

// Realtime -> http://localhost:5000
router.use("/realtime", createServiceProxy(services.realtime));

// Admin -> http://localhost:4011
router.use("/admin", createServiceProxy(services.admin));

export default router;
