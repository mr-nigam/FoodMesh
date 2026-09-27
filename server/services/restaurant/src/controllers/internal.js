import { 
    ApiResponse,
    asyncHandler
} from '@foodmesh/utils';

import {
    fetchCartItemsService,
    deleteCartDataService,
    fetchRestaurantDataService
} from '../services/internal.js';


const fetchCartItems = asyncHandler ( async(req, res) => {
    
    const {
        restaurants,
        allTotalQty,
        allTotalValue
    } = await fetchCartItemsService({
        params: req?.params
    });

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

    const deletedItems = await deleteCartDataService({
        params: req?.params
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { deletedItems },
                "Cart items deleted successfully"
            )
        );
});

const fetchRestaurantData = asyncHandler(async(req, res)=>{
    
    const restaurant = await fetchRestaurantDataService({
        restaurantId: req?.params?.restaurantId ?? null
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {restaurant},
                "Restaurant data fetched successfully"
            )
        );

});

export {
    fetchCartItems,
    deleteCartData,
    fetchRestaurantData
}