// throw new Error("APP.JS LOADED");
// console.log("APP FILE:", import.meta.url);

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import ApiError from './utils/apiError.js';
import restaurantRouter from './routes/restaurant.routes.js';


const app = express();

// app.get("/test", (req, res) => {
//     console.log("TEST ROUTE HIT");
//     res.send("Restaurant Service");
// });


// app.use(cors());

app.use((req, res, next) => {
    console.log("METHOD:", req.method);
    console.log("URL:", req.url);
    next();
});

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}));

app.use((req,res,next)=>{
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
});

if(process.env.NODE_ENV === "development"){
    app.use(morgan('dev'));
};

app.use(express.urlencoded({
    extended: true,
    limit: "50mb"
}));

app.use(express.json({limit: "50mb"}));
app.use(express.static("public"));
app.use(cookieParser());

app.use((req, res, next) => {
    console.log("METHOD:", req.method);
    console.log("URL:", req.url);
    next();
});


app.use("/api/v1/restaurant", restaurantRouter);


app.use((req,res,next)=>{
    next(new ApiError(404, "Route not Found"));
});


export default app;