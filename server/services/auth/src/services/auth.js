import axios from 'axios';
import { 
    OAuth2Client
} from 'google-auth-library';

import { 
    ApiError
} from '@foodmesh/utils';

import {
    generateAccessToken
} from '../utils/token.js';

import{
    loginRepo,
    updateRoleRepo,
    getMyProfileRepo
} from '../repositories/auth.js';

import {
    setCache,
    getCache,
    deleteCache
} from '@foodmesh/redis';


const allowedRoles = [
    "customer",
    "rider",
    "seller",
    "admin",
    "user"
];


const loginService = async({
    body
})=>{

    const code = body?.code || null;

    if(!code){
        throw new ApiError(
            400,
            "Authorization code is required"
        );
    }

    const redirectUri = body?.redirect_uri || "postmessage";

    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );

    const googleRes = await client.getToken(code);

    client.setCredentials(googleRes.tokens);

    const userRes = 
        await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`);

    const {
        email,
        name,
        picture
    } = userRes.data;

    if(!email){
        throw new ApiError(
            404,
            "Enter Email for login"
        );
    }

    const user = await loginRepo({
        email,
        name,
        picture
    });
    
    if(!user){
        throw new ApiError(
            500,
            "Failed to login"
        );
    }

    const accessToken = generateAccessToken(user);

    const cacheKey = `user:${user.id}:profile`;
    await setCache({
        key: cacheKey,
        value: user,
        ttl: 600
    });

    return {
        user,
        token: accessToken
    };
};

const updateRoleService = async({
    userId,
    role
})=>{

    if(!allowedRoles.includes(role)){
        throw new ApiError(
            400,
            "Invalid role"
        );
    }

    const user = await updateRoleRepo({
        userId,
        role
    });

    if(!user){
        throw new ApiError(
            500,
            "failed to update role"
        );
    }

    user.id = userId;
    user.role = role;

    const cacheKey = `user:${userId}:profile`;

    await setCache({
        key: cacheKey,
        value: user,
        ttl: 600
    });

    const accessToken = generateAccessToken(user);

    return {
        user,
        token: accessToken
    };
};

const getMyProfileService = async({
    userId
})=>{

    const cacheKey = `user:${userId}:profile`;

    const cachedUser = await getCache({
        key: cacheKey
    });

    if(cachedUser){
        return cachedUser;
    }

    const user = await getMyProfileRepo({
        userId
    });

    if(!user){
        throw new ApiError(404, "User not found");
    }

    await setCache({
        key: cacheKey,
        value: user,
        ttl: 600
    });

    return user;
};


export {
    loginService,
    updateRoleService,
    getMyProfileService

}