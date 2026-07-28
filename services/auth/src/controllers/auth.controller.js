import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/postgre.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';

import {
    setAuthCookies,
    clearAuthCookies,
} from '../utils/cookie.util.js';

import {
    generateAccessToken
} from '../utils/token.util.js';

const oauth2client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "postmessage"
    // process.env.GOOGLE_REDIRECT_URI
);

const allowedRoles = ["user","rider","seller"];

const loginUser = asyncHandler(async (req,res) => {
    const code = req.body?.code || null;

    if(!code){
        throw new ApiError(
            400,
            "Authorization code is required"
        );
    }

    const googleRes = await oauth2client.getToken(code);

    oauth2client.setCredentials(googleRes.tokens);

    const userRes = 
        await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`);

    const {email, name, picture} = userRes.data;

    if(!email){
        throw new ApiError(
            404,
            "Enter Email for login"
        );
    }

    // if(!allowedRoles.includes(role)) {
    //     throw new ApiError(
    //         400,
    //         "Invalid role"
    //     );
    // }

    const query = `
        SELECT
            id,
            name,
            email,
            role,
            profile_picture_url
        FROM users
            WHERE email = $1
            AND deleted_at IS NULL
            AND deactivated_at IS NULL;
    `;
        
    const result = await pool.query(query,[email]);
    let user = result.rows[0];
        
        // not registered, make new id
    if(result.rowCount === 0){
        const query = `
            INSERT INTO users(
                email, name, profile_picture_url
            )
            VALUES(
                $1, $2, $3
            )
            RETURNING
                id,
                name,
                email,
                role,
                profile_picture_url;
        `;

        const result = await pool.query(
            query,
            [email,name,picture]
        );

        user = result.rows[0];
    }
        
    const accessToken = generateAccessToken(user);
        
    // setAuthCookies(
    //     res,
    //     user,
    //     accessToken
    // );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    user: user,
                    token: accessToken
                },
                "User logged in successfully"
            )
        );
});

const updateRole = asyncHandler(async (req, res)=>{});

const updateDetails = asyncHandler(async (req, res)=>{});


const myProfile = asyncHandler(async (req, res)=>{});
const Home = asyncHandler(async (req, res)=>{});

export {
    loginUser,
    updateRole,
    updateDetails,
    myProfile,
    Home
};