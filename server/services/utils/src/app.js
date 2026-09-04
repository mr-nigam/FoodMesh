import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import ApiError from './utilsss/apiError.js';
import uploadRouter from './routes/utils.js';
import morgan from 'morgan';


const app = express();


app.use(cors());

app.use((req,res,next)=>{
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
});

// if(process.env.NODE_ENV === "development"){
//     app.use(morgan('dev'));
// };

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


app.use("/api/v1/utils", uploadRouter);


app.use((req,res,next)=>{
    next(new ApiError(404, "Route not Found"));
});


export default app;