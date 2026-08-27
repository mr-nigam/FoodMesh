import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';


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
        WITH cart_check AS (
            SELECT restaurant_id 
            FROM carts 
            WHERE user_id = $1 
            LIMIT 1
        ),
        upsert AS (
            INSERT INTO carts (
                user_id,
                restaurant_id,
                item_id,
                price,
                quantity
            )
            SELECT
                $1,
                $2,
                $3,
                $4,
                1
            WHERE NOT EXISTS (
                SELECT 1
                FROM cart_check
                WHERE restaurant_id != $2
            )
            ON CONFLICT (user_id, restaurant_id, item_id)
            DO UPDATE
            SET quantity = carts.quantity + 1
            RETURNING
                id,
                user_id,
                restaurant_id,
                item_id,
                quantity,
                price,
                created_at,
                updated_at
        )
        SELECT
            id,
            user_id,
            restaurant_id,
            item_id,
            quantity,
            price,
            created_at,
            updated_at,
            NULL::uuid AS existing_restaurant_id
        FROM upsert

        UNION ALL

        SELECT
            NULL::uuid AS id,
            $1::uuid AS user_id,
            $2::uuid AS restaurant_id,
            $3::uuid AS item_id,
            NULL::integer AS quantity,
            $4::integer AS price,
            NULL::timestamptz AS created_at,
            NULL::timestamptz AS updated_at,
            restaurant_id AS existing_restaurant_id
        FROM cart_check
        WHERE restaurant_id != $2
        AND NOT EXISTS (
            SELECT 1 FROM upsert
        );
    `;

    const { rows } = await pool.query(query, [userId, restaurantId, itemId, parsedPrice]);

    if(rows.length === 0){
        // Fallback for edge cases
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    {},
                    "Failed to process cart operation"
                )
            );
    }

    const result = rows[0];

    // If existing_restaurant_id exists and doesn't match target restaurant_id
    if (result.existing_restaurant_id && result.existing_restaurant_id !== restaurantId) {
        return res
            .status(400)
            .json(
                new ApiResponse(
                    400,
                    {},
                    "You can only order from one restaurant at a time. Please clear your cart first."
                )
            );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {cartItem : result}, 
                "Item added to cart successfully"
            )
        );
});

const fetchMyCart = asyncHandler(async (req,res) => {
    const userId = req.user.id;

    const searchQuery = `
        SELECT
            r.id AS restaurant_id,

            jsonb_build_object(
                'id', r.id,
                'name', r.name,
                'pictures', r.pictures_urls,
                'address', r.address
            ) AS restaurant,

            jsonb_agg(
                jsonb_build_object(
                    'cart_id', c.id,
                    'item_id', mi.id,
                    'name', mi.name,
                    'category', mi.category,
                    'pictures', mi.pictures_urls,
                    'quantity', c.quantity,
                    'price', c.price,
                    'is_available', mi.is_available
                )
                ORDER BY c.created_at ASC
            ) AS items,

            SUM(c.quantity) AS total_qty,
            sum(c.quantity*c.price)  AS total_value

        FROM carts AS c

        JOIN menu_items mi
            ON c.item_id = mi.id

        JOIN restaurants r
            ON c.restaurant_id = r.id

        WHERE c.user_id = $1
            AND c.quantity > 0
            AND mi.deleted_at IS NULL
            AND mi.deactivated_at IS NULL
            AND r.deleted_at IS NULL
            AND r.deactivated_at IS NULL
        
        GROUP BY 
            r.id,
            r.name,
            r.pictures_urls,
            r.address

        ORDER BY MIN(c.created_at) ASC;
    `;

    const {rows} = await pool.query(
        searchQuery,
        [userId]
    );

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


export {
    addToCart,
    fetchMyCart,
    updateCartItemQuantity,
    clearCart
}