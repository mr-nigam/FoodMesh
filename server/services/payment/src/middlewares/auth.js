import jwt from 'jsonwebtoken';
import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from './asyncHandler.js';


const serviceKeys = {
    "order-service": process.env.ORDER_SERVICE_KEY,
    "restaurant-service": process.env.RESTAURANT_SERVICE_KEY,
    "cart-service": process.env.CART_SERVICE_KEY,
    "rider-service": process.env.RIDER_SERVICE_KEY
};

const authenticateUser = asyncHandler(async (req, _, next) => {
    // 1. Extract token safely
    const authHeader = req.header("Authorization");

    const token =
        req?.cookies?.accessToken ||
        (authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null
        );

    if(!token){
        throw new ApiError(
            401,
            "Access token is missing"
        );
    }

    let decodedToken;

    // 3. Verify token
    try{
        decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );
    }catch(err){
        throw new ApiError(
            401,
            "Invalid or expired access token"
        );
    }

    // yup done it baby
    let user;

    try {
        const query = `
            SELECT 
                id,
                name,
                role,
                email,
                profile_picture_url,
                password_changed_at
            FROM users
            WHERE id = $1
                AND deleted_at IS NULL
                AND deactivated_at IS NULL
            LIMIT 1;
        `;

        const {rows} = await pool.query(
            query,
            [decodedToken?.id]
        );
        
        if(rows.length === 0){
            throw new ApiError(
                401,
                "User not found or token invalid"
            );
        }

        user = rows[0];
    } catch(dbErr) {
        if(dbErr instanceof ApiError) throw dbErr;
        user = {
            id: decodedToken?.id,
            email: decodedToken?.email,
            role: decodedToken?.role,
            name: decodedToken?.name
        };
    }

    // Invalidate old tokens after password change
    if(user.password_changed_at){
        const tokenIssuedAtMs = decodedToken.iat * 1000;

        const passwordChangedAtMs =
            new Date(
                user.password_changed_at
            ).getTime();

        if(tokenIssuedAtMs < passwordChangedAtMs){
            throw new ApiError(
                401,
                "Password changed. Please login again"
            );
        }
    }

    // Remove sensitive/internal fields
    delete user.password_changed_at;
     
    req.user = user;

    next();
});

// yup done it baby
const authenticateService = (req, res, next) => {
    const serviceName = req.headers["x-service-name"];
    const serviceKey = req.headers["x-service-key"];

    if (!serviceName || !serviceKey) {
        return res
            .status(401)
            .json({
                message: "Unauthorized service: Missing x-service-name or x-service-key header"
            });
    }

    const currentServiceKeys = {
        "order-service": process.env.ORDER_SERVICE_KEY,
        "restaurant-service": process.env.RESTAURANT_SERVICE_KEY,
        "cart-service": process.env.CART_SERVICE_KEY,
        "rider-service": process.env.RIDER_SERVICE_KEY
    };

    const expectedKey = currentServiceKeys[serviceName];

    if (expectedKey && expectedKey !== serviceKey) {
        console.warn(`[Auth] Service key mismatch for ${serviceName}. Expected: ${expectedKey}, Received: ${serviceKey}`);
        return res
            .status(401)
            .json({
                message: "Unauthorized service: Key mismatch"
            });
    }

    req.service = serviceName;

    next();
};


export {
    authenticateUser,
    authenticateService
};