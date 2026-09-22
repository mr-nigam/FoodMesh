import getBuffer from '../config/datauri.js';
import axios from 'axios';

import { 
    ApiError,
    ApiResponse,
} from '@foodmesh/utils';

import {
    uploadFile
} from '../clients/utils.js'

import {
    validateRegisterRider
} from '../validators/validateRegister.js';

import {
    setCache,
    getCache,
    deleteMultipleCache,
    cachePaginatedList,
    getPaginatedList
} from '@foodmesh/redis';

import {
    registerRepo,
    fetchMyRestaurantRepo,
    updateRestaurantStatusRepo,
    updateRestaurantDetailsRepo,
    getNearbyRestaurantsRepo,
    fetchSingleRestaurantRepo
} from '../repositories/restaurant.js'

import{
    verifyCoordinates
} from '@foodmesh/utils';


const registerService = async ({
   userId,
   body,
   file
})=>{

    const {
        valid,
        params,
        errors
    } = validateRegisterRider({
        userId,
        data: body
    });
    
    if(!valid){
        throw new ApiError(
            400,
            errors
        );
    }

    const pictureUrl = await uploadFile({
        file
    });

    params.push([pictureUrl]);

    const restaurant = await registerRepo({
        params
    });

    if(!restaurant){
        throw new ApiError(
            400,
            "Failed to register restaurant"
        );
    }

    return restaurant;
};

const fetchMyRestaurantService = async ({
    restaurantId
}) => {

    if(!restaurantId){
        throw new ApiError(
            400,
            "Please provide restaurant id"
        );
    }
    
    const restaurant = await fetchMyRestaurantRepo({
        restaurantId
    });

    if(!restaurant){
        throw new ApiError(
            500,
            "failed to fetch restaurant"
        );
    }

    return restaurant;
};

const updateRestaurantStatusService = async({
    restaurantId,
    status
})=>{

    if(
        !restaurantId
    ){
        throw new ApiError(
            400,
            "please provide status and restaurant id"
        );
    }

    const restaurant = await updateRestaurantStatusRepo({
        restaurantId,
        status
    });

    if(!restaurant){
        throw new ApiError(
            500,
            "fail to update status"
        );
    }

    return restaurant;
};

const updateRestaurantDetailsService = async ({
    restaurantId,
    body
})=>{

    
    const restaurantName = body?.name?.trim() || "";
    const description = body?.description?.trim() || "";

    if( !restaurantName && !description){
        throw new ApiError(
            400, 
            "Please enter name or description"
        );
    }

    const restaurant = await updateRestaurantDetailsRepo({
        restaurantId,
        restaurantName,
        description
    });

    if(!restaurant){
        throw new ApiError(
            500,
            "fail to update restaurnt details"
        );
    }

    return restaurant;
};

const getNearbyRestaurantsService = async ({ 
    query
}) => {
    const {
        latitude,
        longitude,
        radius = 5000,
        search = "",
    } = query;

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
        !verifyCoordinates({
            longitude: lon,
            latitude: lat,
        })
    ) {
        throw new ApiError(
            400,
            "Please provide correct location"
        );
    }

    const searchRadius = Number(radius);

    if (
        !Number.isFinite(searchRadius) ||
        searchRadius <= 0
    ) {
        throw new ApiError(
            400,
            "radius must be greater than 0"
        );
    }

    const page = Math.max(
        Number(query.page) || 1,
        1
    );

    const limit = Math.min(
        Math.max(Number(query.limit) || 50, 1),
        100
    );

    const offset = (page - 1) * limit;

    const restaurants = await getNearbyRestaurantsRepo({
        latitude: lat,
        longitude: lon,
        radius: Math.min(searchRadius, 15000),
        search: search.trim(),
        limit,
        offset,
    });

    return restaurants;
};

const fetchSingleRestaurantService = async ({
    restaurantId
}) => {

    if(!restaurantId){
        throw new ApiError(
            400,
            "Restaurant id is required"
        );
    }

    const restaurant = await fetchSingleRestaurantRepo({
        restaurantId
    });

    if(!restaurant){
        throw new ApiError(
            500,
            "fail to fetch restaurant"
        );
    }

    return restaurant;  
};


export {
    registerService,
    fetchMyRestaurantService,
    updateRestaurantStatusService,
    updateRestaurantDetailsService,
    getNearbyRestaurantsService,
    fetchSingleRestaurantService
};