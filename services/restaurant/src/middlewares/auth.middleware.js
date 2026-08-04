import jwt from 'jsonwebtoken';
import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from './asyncHandler.js';


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

    const result = await pool.query(
        query,
        [decodedToken?.id]
    );
    
    if(result.rowCount === 0){
        throw new ApiError(
            401,
            "User not found or token invalid"
        );
    }

    const user =  result.rows[0];

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

const isSeller = asyncHandler(async(req,_,next)=>{
    const user = req.user;

    if(user && user.role !== "seller"){
        throw new ApiError(
            401,
            "You are not authorized seller"
        );
    }

    next();
});


export {
    authenticateUser,
    isSeller
};