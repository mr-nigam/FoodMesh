import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import getBuffer from '../config/datauri.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';


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
            address,
            pictures_urls
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
                    {restaurant: existingRestruant.rows[0]},
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

    try {
        const restaurant = await pool.query(
            insertQuery,
            values
        );

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    { restaurant: restaurant.rows[0] },
                    "Restaurant created successfully"
                )
            );

    }catch(error){
        
        // console.log("========== POSTGRES ERROR ==========");
        // console.log("message:", error.message);
        // console.log("code:", error.code);
        // console.log("detail:", error.detail);
        // console.log("constraint:", error.constraint);
        // console.log("table:", error.table);
        // console.log("column:", error.column);
        // console.log("schema:", error.schema);
        // console.log("====================================");

        throw error;
    }

});

const fetchMyRestaurant = asyncHandler( async(req, res)=>{
    const user = req.user;

    if(!user){
        throw new ApiError(
            401,
            "Unauthorized"
        );
    }

    const searchQuery = `
        SELECT
            id,
            name,
            email,
            description,
            phone,
            address,
            pictures_urls
        FROM restaurants
            WHERE owner_id = $1
                AND deleted_at IS NULL
                AND deactivated_at IS NULL;
    `;

    const result = await pool.query(
        searchQuery,
        [user.id]
    );

    if(result.rowCount === 0){
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        restaurant: null
                    },
                    "No restaurant found"
                )
            );
    }

    if(!user.restaurantId){
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                restaurantId: result.rows[0].id,
            },
            process.env.ACCESS_TOKEN_SECRET,{
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        restaurant: result.rows[0],
                        token : token
                    },
                "Resturant data fecthed successfully"
                )
            )
    }
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    restaurant: result.rows[0]
                },
                "Resturant data fecthed successfully"
            )
        );

});

const updateRestaurant = asyncHandler( async(req, res)=>{});
const fetchSingleRestaurant = asyncHandler( async(req, res)=>{});
const fetchMultipleRestaurant = asyncHandler( async(req, res)=>{});


export {
    addRestaurant,
    fetchMyRestaurant,
    updateRestaurant
};