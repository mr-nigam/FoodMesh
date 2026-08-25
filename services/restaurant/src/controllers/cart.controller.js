import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';


const addToCart = asyncHandler(async (req, res) => {
    const {
        restaurantId,
        itemId,
        price
    } = req.body;

    const trimmedRestaurantId = restaurantId?.trim() || "";
    const trimmedItemId = itemId?.trim() || "";

    if (!trimmedRestaurantId || !trimmedItemId) {
        throw new ApiError(400, "Invalid restaurant and item id");
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
            INSERT INTO carts (user_id, restaurant_id, item_id, price, quantity)
            SELECT $1, $2, $3, %4, 1
            WHERE NOT EXISTS (
                SELECT 1 FROM cart_check WHERE restaurant_id != $2
            )
            ON CONFLICT (user_id, item_id) 
            DO UPDATE SET quantity = carts.quantity + 1
            RETURNING *, (SELECT restaurant_id FROM cart_check) AS existing_restaurant_id
        )
        SELECT * FROM upsert
        UNION ALL
        SELECT NULL AS id, $1 AS user_id, $2 AS restaurant_id, $3 AS item_id, $4 AS price, NULL AS quantity, restaurant_id AS existing_restaurant_id
        FROM cart_check
        WHERE restaurant_id != $2 AND NOT EXISTS (SELECT 1 FROM upsert);
    `;

    const { rows } = await pool.query(query, [userId, trimmedRestaurantId, trimmedItemId, parsedPrice]);

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

const fecthMyCart = asyncHandler(async (req,rq) => {
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
                ORDER BY c.updated_at DESC
            ) AS items,

            SUM(c.quantity) AS total_qty,
            sum(c.quantity*c.price)  AS total_value

        FROM carts AS c

        JOIN menu_items mi
            ON c.item_id = mi.id

        JOIN restaurants r
            ON c.restaurant_id = r.id

        WHERE c.user_id = $1
            AND mi.deleted_at IS NULL
            AND mi.deactivated_at IS NULL
            AND r.deleted_at IS NULL
            AND r.deactivated_at IS NULL
        
        GROUP BY 
            r.id,
            r.name,
            r.pictures_urls,
            r.address

        ORDER BY MAX(c.updated_at) DESC;
    `;

    const {rows} = await pool.query(
        searchQuery,
        [userId]
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    restaurants: rows.map((row) => ({
                        restaurant: row.restaurant,
                        items: row.items,
                        totalQty: Number(row.total_qty),
                        totalValue: Number(row.total_value)
                    }))
                },
                "All cart items fetched successfully"
            )
        );
});


const removeFromCart = asyncHandler(async()=>{});


export {
    addToCart,
    fecthMyCart,
    removeFromCart
}