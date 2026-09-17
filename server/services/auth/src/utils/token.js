import jwt from 'jsonwebtoken';


const generateAccessToken = (user) =>{

    const data = {
        id: user.id,
        role: user.role,
    };

    if(user.role === "rider"){
        data.riderId = user.professional_id
    }else if(user.role === "seller"){
        data.restaurantId = user.professional_id
    }else if(user.role === "seller"){
        data.adminId = user.professional_id
    }

    return jwt.sign(
        data,
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

const generateRefreshToken = (user) =>{
    const data = {
        id: user.id,
        role: user.role,
    };

    if(user.role === "rider"){
        data.riderId = user.professional_id
    }else if(user.role === "seller"){
        data.restaurantId = user.professional_id
    }else if(user.role === "seller"){
        data.adminId = user.professional_id
    }

    return jwt.sign(
        data,
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};


export {
    generateAccessToken,
    generateRefreshToken
};