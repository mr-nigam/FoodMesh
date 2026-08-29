import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';

import {
    fetchCartItemsRepo
} from '../repositories/internal.js';


const fetchCartItems = asyncHandler ( async(req, res) =>{
    const userId = req?.params?.userId?.trim() || "";
    const restaurantId = req?.params?.restaurantId?.trim() || "";

    if(!userId){
        throw new ApiError(
            400,
            "Please provide user id"
        );
    }
     
    const rows = await fetchCartItemsRepo({
        userId,
        restaurantId
    });

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

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    restaurants,
                    allTotalQty,
                    allTotalValue
                },
                "All cart items fetched successfully"
            )
        );
});


export {
    fetchCartItems
}