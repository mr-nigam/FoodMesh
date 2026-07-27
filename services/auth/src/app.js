import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import morgan from 'morgan';
import authRouter from './routes/auth.routes.js';
import ApiError  from './utils/apiError.js';


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

// dev logger
if(process.env.NODE_ENV === "development"){
    app.use(morgan("dev"));
}

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

app.use(express.json({limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

app.use((req, res, next) => {
    console.log("METHOD:", req.method);
    console.log("URL:", req.url);
    next();
});

app.use("/api/v1/auth",authRouter);


app.use((req,res,next)=>{
    next(new ApiError(404, "Route not Found"));
});


export default app;