import jwt from 'jsonwebtoken';
import {
    asyncHandler,
    ApiError
} from '../index.js'


const authenticateUser = asyncHandler(async (req, _, next) => {
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

    try{
        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );
        
        req.user = decodedToken;
        next();

    }catch(err){
        throw new ApiError(
            401,
            "Invalid or expired access token"
        );
    }
});

const requireRole = (...allowedRoles) => {
  return (req, _, next) => {
    if (!req.user) {
      throw new ApiError(401, "User authentication required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, `Forbidden: Requires one of these roles: [${allowedRoles.join(", ")}]`);
    }

    next();
  };
};

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
    requireRole,
    isSeller
};