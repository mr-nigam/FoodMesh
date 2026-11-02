import '@foodmesh/utils/config/env';
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import requestLogger from "./middlewares/requestLogger.js";
import errorHandler from "./middlewares/errorHandler.js";

import proxyRoutes from "./routes/proxyRoutes.js";


const app = express();

app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
});

// CORS: allow frontend origins (localhost:5173, etc.) and credentials
app.use(cors({
    origin: (origin, callback) => {
        callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-service-name",
        "x-service-key",
        "x-gateway-request"
    ]
}));

// Logging
app.use(requestLogger);

// Cookie parsing
app.use(cookieParser());

// Health check
app.get(["/health", "/api/v1/health"], (req, res) => {
    res.status(200).json({
        success: true,
        service: "FoodMesh API Gateway",
        status: "UP"
    });
});

// Proxy routes (mounted at /api/v1)
app.use("/api/v1", proxyRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found on API Gateway: ${req.method} ${req.originalUrl}`
    });
});

// Global error handler
app.use(errorHandler);


export default app;
