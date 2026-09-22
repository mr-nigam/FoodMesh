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

    const restaurant = await updateRestaurantStatusService({
        restaurantId: req?.user?.restaurantId,
        status: req?.body?.status ?? ""
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { restaurant},
                restaurant
                    ? "Restaurant status updated successfully"
                    : "No restaurant found"
            )
        );
});

const updateRestaurantDetails = asyncHandler(async (req,res)=>{

    const restaurant = await updateRestaurantDetailsService({
        restaurantId: req?.user?.restaurantId,
        body: req.body
    });
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {restaurant},
                "Restaurant data updated successfully"
            )
        );
});

const getNearbyRestaurants = asyncHandler(async (req, res) => {

    const restaurants = await getNearbyRestaurantsService({
        query: req.query
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {restaurants},
                "Nearby restaurants fetched successfully"
            )
        );
});

const fetchSingleRestaurant = asyncHandler(async (req, res) => {

    const restaurant = await fetchMyRestaurantService({
        restaurantId: req?.params?.restaurantId ?? req?.params?.id
    })
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {restaurant},
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