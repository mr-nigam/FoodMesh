import express from "express";
import { 
    createProxyMiddleware
} from "http-proxy-middleware";

import { services } from "../config/services.js";

const router = express.Router();

const createServiceProxy = (target) => {

    return createProxyMiddleware({

        target,

        changeOrigin: true,

        // Preserve the original request path.
        // The service URLs already contain their base paths.

        on: {
            error: (err, req, res) => {

                console.error(
                    `[GATEWAY] Proxy Error: ${err.message}`
                );

                if (!res.headersSent) {
                    res.writeHead(502, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        success: false,
                        message: "Service temporarily unavailable"
                    }));
                }
            },

            proxyReq: (proxyReq, req) => {
                proxyReq.setHeader(
                    "x-gateway-request",
                    "foodmesh-gateway"
                );
            }
        }
    });
};

// Auth
router.use("/auth", createServiceProxy(services.auth));

// Restaurant
router.use("/restaurant", createServiceProxy(services.restaurant));

// Cart
router.use("/cart", createServiceProxy(services.cart));

// Utils
router.use("/utils", createServiceProxy(services.utils));

// User
router.use("/user", createServiceProxy(services.user));

// Order
router.use("/order", createServiceProxy(services.order));

// Rider
router.use("/rider", createServiceProxy(services.rider));

// Payment
router.use("/payment", createServiceProxy(services.payment));

// Analytics
router.use("/analytics", createServiceProxy(services.analytics));

// Delivery
router.use("/delivery", createServiceProxy(services.delivery));

// Notification
router.use("/notification", createServiceProxy(services.notification));

// Realtime
router.use("/realtime", createServiceProxy(services.realtime));

router.use("/amdin",createServiceProxy(services.admin));

export default router;