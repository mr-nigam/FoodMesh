// Central env loader
import '@foodmesh/utils/config/env';

import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";

import { 
    ApiError,
    errorHandler
 } from '@foodmesh/utils';

import authRouter from './routes/auth.js';


const app = express();


app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}));

// in app.js, add this header for all responses
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
});

app.use(express.urlencoded({
    extended: true,
    limit: "50mb"
}));

app.use(express.json({limit: "50mb"}));
app.use(express.static("public"));
app.use(cookieParser());


app.use("/api/v1/auth", authRouter);


app.use((req,res,next)=>{
    next(new ApiError(404, "Route not Found"));
});

app.use(errorHandler);


export default app;