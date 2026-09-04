import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';

import {
    fetchCartItemsRepo
} from '../repositories/internal.js';


const addToCart = asyncHandler(async (req, res) => {
    const restaurantId = req.body?.restaurantId?.trim() || "";
    const itemId = req.body?.itemId?.trim() || "";

    const {
        price
    } = req.body;

     if (!restaurantId || !itemId) {
        throw new ApiError(
            400,
            "Invalid restaurant and item id"
        );
    }

    const parsedPrice = Number(price);

    if(!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        throw new ApiError(
            400,
            "Price must be a valid non-negative number"
        );
    }

    const userId = req.user.id;

    const query = `
        INSERT INTO carts (
            user_id,
            restaurant_id,
            item_id,
            price,
            quantity
        )
        VALUES ($1, $2, $3, $4, 1)
        ON CONFLICT (user_id, restaurant_id, item_id)
        DO UPDATE
        SET quantity = carts.quantity + 1,
            price = EXCLUDED.price,
            updated_at = CURRENT_TIMESTAMP
        RETURNING
            id,
            user_id,
            restaurant_id,
            item_id,
            quantity,
            price,
            created_at,
            updated_at;
    `;

    const { rows } = await pool.query(query, [userId, restaurantId, itemId, parsedPrice]);

    if (rows.length === 0) {
        throw new ApiError(
            500,
            "Failed to add item to cart"
        );
    }

    const result = rows[0];

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                { cartItem: result }, 
                "Item added to cart successfully"
            )
        );
});

const fetchMyCart = asyncHandler(async (req,res) => {
    const userId = req.user.id;

    const rows = await fetchCartItemsRepo({
        userId
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

const updateCartItemQuantity = asyncHandler(async(req, res)=>{
    const { itemId, action } = req.body;

    if(!itemId){
        throw new ApiError(
            400,
            "Invalid item id"
        );
    }

    if(!["inc", "dec"].includes(action)){
        throw new ApiError(
            400,
            "Invalid cart action"
        );
    }

    const userId = req.user.id;

    // Check existing item in cart first
    const { rows: existingRows } = await pool.query(
        `SELECT id, quantity FROM carts WHERE item_id = $1 AND user_id = $2`,
        [itemId, userId]
    );

    if (existingRows.length === 0) {
        throw new ApiError(
            404,
            "Item not found in your cart"
        );
    }

    const currentQty = Number(existingRows[0].quantity || 0);

    // If decreasing and current quantity is 1 or less, DELETE item from cart
    if (action === "dec" && currentQty <= 1) {
        await pool.query(
            `DELETE FROM carts WHERE item_id = $1 AND user_id = $2`,
            [itemId, userId]
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        cartItem: null,
                        removed: true,
                        action,
                    },
                    "Item removed from cart"
                )
            );
    } else {
        const upValue = action === "inc" ? 1 : -1;

        const { rows } = await pool.query(
            `UPDATE carts
             SET quantity = quantity + $1
             WHERE item_id = $2 AND user_id = $3
             RETURNING id, quantity, price, restaurant_id, item_id`,
            [upValue, itemId, userId]
        );

        if (rows.length === 0) {
            throw new ApiError(404, "Item not found in your cart");
        }

        const cartItem = rows[0];

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        cartItem,
                        removed: false,
                        action,
                    },
                    "Item quantity updated successfully"
                )
            );
    }
});

const clearCart = asyncHandler(async(req, res)=>{
    const deleteQuery = `
        DELETE FROM carts
        WHERE user_id = $1;
    `;

    await pool.query(
        deleteQuery,
        [req.user?.id]
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Cart cleared successfully"
            )
        );
});

const removeCartItem = asyncHandler(async(req, res)=>{
    const itemId = req.params?.itemId?.trim() || "";
    
    if(!itemId){
        throw new ApiError(
            400,
            "Please give a valid item id"
        );
    }

    const deleteQuery = `
        DELETE FROM carts
        WHERE item_id = $1
            AND user_id = $2
        RETURNING id;
    `;

    const {rows} = await pool.query(
        deleteQuery,
        [itemId, req?.user?.id]
    );

    if(rows.length === 0){
        throw new ApiError(
            404,
            "Cart item not found or already removed"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Cart item removed successfully"
            )
        );
});

const removeRestaurantItems = asyncHandler(async(req, res)=>{
    const restaurantId = req.params?.restaurantId?.trim() || "";
    
    if(!restaurantId){
        throw new ApiError(
            400,
            "Please give a valid restaurant id"
        );
    }

    const deleteQuery = `
        DELETE FROM carts
        WHERE restaurant_id = $1
            AND user_id = $2
        RETURNING id;
    `;

    const {rows} = await pool.query(
        deleteQuery,
        [restaurantId, req?.user?.id]
    );

    if(rows.length === 0){
        throw new ApiError(
            404,
            "No items found for this restaurant in your cart"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "All items for the restaurant removed successfully"
            )
        );
});


export {
    addToCart,
    fetchMyCart,
    updateCartItemQuantity,
    clearCart,
    removeCartItem,
    removeRestaurantItems
}