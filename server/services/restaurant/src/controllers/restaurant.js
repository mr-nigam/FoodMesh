import pool from '../config/postgre.js';


import { 
    ApiError,
    ApiResponse,
    asyncHandler
} from '@foodmesh/utils';

import {
    registerService,
    fetchMyRestaurantService,
    updateRestaurantStatusService,
    updateRestaurantDetailsService,
    getNearbyRestaurantsService,
    fetchSingleRestaurantService
} from '../services/restaurant.js';


const register = asyncHandler(async (req, res)=>{

    const restaurant = await registerService({
        userId: req?.user?.id,
        body: req.body,
        file: req?.file
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { restaurant },
                "Restaurant created successfully"
            )
        );
});

const fetchMyRestaurant = asyncHandler(async (req, res) => {
    
    const restaurant = await fetchMyRestaurantService({
        restaurantId: req?.user?.restaurantId
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { restaurant},
                restaurant
                    ? "Restaurant data fetched successfully"
                    : "No restaurant found"
            )
        );
});

const updateRestaurantStatus = asyncHandler( async(req, res)=>{
    const user = req.user;
    
    const {status} = req.body;

    const updateQuery = `
        UPDATE restaurants
        SET 
            is_open = $1
        WHERE owner_id = $2
            AND deleted_at IS NULL
            AND deactivated_at IS NULL
        RETURNING
            id,
            name,
            email,
            description,
            phone,
            address,
            pictures_urls,
            is_open,
            created_at;
    `;
    
    const {rows} = await pool.query(
        updateQuery,
        [status, user.id]
    );

    const restaurant = rows[0] || null;

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    restaurant,
                },
                restaurant
                    ? "Restaurant status updated successfully"
                    : "No restaurant found"
            )
        );
        

});

const updateRestaurantDetails = asyncHandler(async (req,res)=>{
    const user = req.user;

    const restaurantName = req.body?.name?.trim() || "";
    const description = req.body?.description?.trim() || "";

    if( !restaurantName && !description){
        throw new ApiError(
            400, 
            "Please enter name or description"
        );
    }

    const updateQuery = `
        UPDATE restaurants
        SET 
            name = $1,
            description = $2
        WHERE owner_id = $3
            AND deleted_at IS NULL
            AND deactivated_at IS NULL
        RETURNING
            id,
            name,
            email,
            description,
            phone,
            address,
            pictures_urls,
            is_open,
            created_at;
    `;

    const {rows} = await pool.query(
        updateQuery,
        [restaurantName, description, user.id]
    );

    if(rows.count === 0){
        throw new ApiError(
            404,
            "Restaurnt not found"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    restauran: rows[0]
                },
                "Restaurant data updated successfully"
            )
        );
});

const getNearbyRestaurants = asyncHandler(async (req, res) => {
    const {
        latitude,
        longitude,
        radius = 5000,
        search = ""
    } = req.query;

    if(latitude === undefined || longitude === undefined){
        throw new ApiError(
            400,
            "latitude and longitude are required for searching nearby restaurants"
        );
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    const searchRadius = Number(radius);

    if(
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        !Number.isFinite(searchRadius)
    ){
        throw new ApiError(
            400,
            "latitude, longitude and radius must be valid numbers"
        );
    }

    if(lat < -90 || lat > 90){
        throw new ApiError(
            400,
            "Invalid latitude"
        );
    }

    if(lon < -180 || lon > 180){
        throw new ApiError(
            400,
            "Invalid longitude"
        );
    }

    if(searchRadius <= 0){
        throw new ApiError(
            400,
            "radius must be greater than 0"
        );
    }

    const searchQuery = `
        SELECT
            id,
            name,
            description,
            pictures_urls,
            address,
            is_open,
            type,
            phone,
            ST_Distance(
                location,
                ST_SetSRID(
                    ST_MakePoint($1, $2),
                    4326
                )::geography
            ) AS distance

        FROM restaurants

        WHERE

            ST_DWithin(
                location,
                ST_SetSRID(
                    ST_MakePoint($1, $2),
                    4326
                )::geography,
                $3
            )

            AND (
                $4 = ''
                OR name ILIKE '%' || $4 || '%'
            )

        ORDER BY distance ASC;
    `;

    const { rows } = await pool.query(searchQuery, [
        lon,
        lat,
        searchRadius,
        search.trim()
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {restaurants: rows},
                "Nearby restaurants fetched successfully"
            )
        );
});

const fetchSingleRestaurant = asyncHandler(async (req, res) => {
    const { restaurantId } = req.params;

    if(!restaurantId){
        throw new ApiError(
            400,
            "Restaurant id is required"
        );
    }

    const searchQuery = `
        SELECT
            id,
            name,
            description,
            pictures_urls,
            address,
            location,
            is_open,
            created_at
        FROM restaurants
        WHERE id = $1;
    `;

    const { rows } = await pool.query(
        searchQuery,
        [restaurantId]
    );

    if(rows.length === 0){
        throw new ApiError(
            404,
            "Restaurant not found"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {restaurant: rows[0]},
                "Restaurant fetched successfully"
            )
        );
});


export {
    register,
    fetchMyRestaurant,
    updateRestaurantStatus,
    updateRestaurantDetails,
    getNearbyRestaurants,
    fetchSingleRestaurant
};