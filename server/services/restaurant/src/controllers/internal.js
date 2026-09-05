import { 
    ApiError,
    ApiResponse,
    asyncHandler
} from '@foodmesh/utils';

import {
    fetchCartItemsRepo,
    deleteCartDataRepo
} from '../repositories/internal.js';


const fetchCartItems = asyncHandler ( async(req, res) => {
    const userId = req?.params?.userId?.trim() || "";
    const restaurantId = req?.params?.restaurantId?.trim() || "";
    const requestType = req?.params?.requestType?.trim() || "";

    if(!userId || !requestType){
        throw new ApiError(
            400,
            "Please provide both user id and requestType."
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

const deleteCartData = asyncHandler( async(req, res) => { 
    const userId = req?.params?.userId?.trim() ?? null;
    const restaurantId = req?.params?.restaurantId?.trim() ?? null;
    const requestType = req?.params?.requestType?.trim() || "";

    if(!userId || !requestType){
        throw new ApiError(
            400,
            "Please provide both user id and requestType."
        );
    }

    const rs = await deleteCartDataRepo({
        userId,
        restaurantId,
        requestType
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { deletedItems: rs },
                "Cart items deleted successfully"
            )
        );
});


export {
    fetchCartItems,
    deleteCartData
}