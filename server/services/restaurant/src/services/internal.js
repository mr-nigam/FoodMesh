import { 
    ApiError
} from '@foodmesh/utils';

import {
    fetchCartItemsRepo,
    deleteCartDataRepo,
    fetchRestaurantDataRepo
} from '../repositories/internal.js';


const fetchCartItemsService = async({
    params
})=>{

    const userId = params?.userId?.trim() || "";
    const restaurantId = params?.restaurantId?.trim() || "";
    const requestType = params?.requestType?.trim() || "";

    if(
        !userId || 
        !requestType
    ){
        throw new ApiError(
            400,
            "Please provide both user id and requestType."
        );
    }
     
    const rows = await fetchCartItemsRepo({
        userId,
        restaurantId
    });

    if(!rows || rows.length === 0){
        throw new ApiError(
            400,
            "Fail to fetch cart items of this user"
        );
    }

    const allTotalQty = rows.reduce(
        (sum, restaurant) => sum + Number(restaurant.total_qty || 0),
        0
    );

    const allTotalValue = rows.reduce(
        (sum, restaurant) => sum + Number(restaurant.total_value || 0),
        0
    );

    const restaurants = rows.map((row) => ({
        restaurant: row.restaurant,
        items: row.items,
        totalQty: Number(row.total_qty || 0),
        totalValue: Number(row.total_value || 0),
    }));

    return {
        restaurants,
        allTotalQty,
        allTotalValue   
    };
};

const deleteCartDataService = async({
    params
})=>{

    const userId = params?.userId?.trim() ?? null;
    const restaurantId = params?.restaurantId?.trim() ?? null;
    const requestType = params?.requestType?.trim() || "";

    if(
        !userId || 
        !requestType
    ){
        throw new ApiError(
            400,
            "Please provide both user id and requestType."
        );
    }

    const deletedItems = await deleteCartDataRepo({
        userId,
        restaurantId,
        requestType
    });

    if(!deletedItems){
        throw new ApiError(
            500,
            "Fail to delete cart items"
        );
    }

    return deletedItems;
};

const fetchRestaurantDataService = async({
    restaurantId
})=>{

    if(!restaurantId){
        throw new ApiError(
            400,
            "Please send restaurant ID"
        )
    }

    const restaurant = await fetchRestaurantDataRepo({
        restaurantId
    });

    if(!restaurant){
        throw new ApiError(
            404,
            "Restaurant not found"
        );
    }

    return restaurant;
};


export {
    fetchCartItemsService,
    deleteCartDataService,
    fetchRestaurantDataService
};