import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import getBuffer from '../config/datauri.js';
import axios from 'axios';


const addRestaurant = asyncHandler(async (req, res)=>{
    const user = req.user;
    
    if(!user){
        throw new ApiError(
            401,
            "Unauthorized"
        );
    }

    const checkQuery  = `
        SELECT
            id,
            name,
            email,
            description,
            phone,
            address
        FROM restaurants
            WHERE owner_id = $1
            AND deleted_at IS NULL
            AND deactivated_at IS NULL;
    `;

    const existingRestruant = await pool.query(
        checkQuery,
        [user.id]
    );

    if(existingRestruant.rowCount>0){
        return res
            .status(400)
            .json(
                new ApiResponse(
                    400,
                    {restruant: existingRestruant.rows[0]},
                    "You already have a restaurant"
                )
            );
    }

    const {
        name,
        description,
        latitude,
        longitude,
        formattedAddress,
        phone,
        email
    } = req.body;
    
    if(!name || !latitude || !longitude){
        throw new ApiError(
            400,
            "Please give all the mandaroty details"
        );
    }

    const file = req.file;

    if(!file){
        throw new ApiError(
            400,
            "Please upload images"
        );
    }
    
    const fileBuffer = getBuffer(file);

    if(!fileBuffer?.content){
        throw new ApiError(
            500,
            "Faield to create file buffer"
        );
    }

    const uploadResponse = await axios.post(
        `${process.env.UTILS_SERVICE}/api/v1/utils/upload`,
        { buffer: fileBuffer.content}
    );

    const pictureUrl = uploadResponse.data?.url || uploadResponse.data?.data?.url;

    
    if (!pictureUrl) {
        throw new ApiError(500, "Failed to upload image");
    }
    
    const picturesUrls = [pictureUrl]; // Array of image URLs

    const insertQuery = `
        INSERT INTO restaurants(
            owner_id,
            name,
            description,
            email,
            phone,
            pictures_urls,
            location,
            address 
        )
        VALUES(
            $1, $2, $3,
            $4, $5, $6,
            ST_SetSRID(
                    ST_MakePoint($7, $8),
                    4326
                )::GEOGRAPHY,
            $9
        )
        RETURNING
            id,
            name,
            description,
            phone,
            email,
            address,
            pictures_urls;
    `;

    const values = [
        user.id,
        name,
        description,
        email,
        phone,
        picturesUrls,
        longitude,
        latitude,
        formattedAddress
    ];

    const restaurant = await pool.query(
        insertQuery,
        values
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {restaurant :restaurant.rows[0]},
                "Restaurant created successfully"
            )
        );

});


export {
    addRestaurant
};