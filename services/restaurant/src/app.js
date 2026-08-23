import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import ApiError from './utils/apiError.js';
import errorHandler from "./middlewares/errorHandler.js";
import restaurantRouter from './routes/restaurant.routes.js';
import menuItemsRouter from './routes/menuItem.routes.js';


const app = express();


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
app.use("/api/v1/restaurant/menu", menuItemsRouter);


app.use((req,res,next)=>{
    next(new ApiError(404, "Route to nhi mila"));
});

app.use(errorHandler);


export default app;
