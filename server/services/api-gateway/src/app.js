import express from "express";
import cors from "cors";
import helmet from "helmet";

import requestLogger from "./middlewares/requestLogger.js";
import errorHandler from "./middlewares/errorHandler.js";

import proxyRoutes from "./routes/proxyRoutes.js";


const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

// Logging
app.use(requestLogger);

// Health check
app.get("/health", (req, res) => {

    res.status(200).json({
        success: true,
        service: "FoodMesh API Gateway",
        status: "UP"
    });

});

// Proxy routes
app.use("/api/v1", proxyRoutes);


// 404
app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "Route not found"
    });

});

// Global error handler
app.use(errorHandler);


export default app;