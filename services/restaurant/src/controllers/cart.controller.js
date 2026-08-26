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
            INSERT INTO carts (user_id, restaurant_id, item_id, price, quantity)
            SELECT $1, $2, $3, $4, 1
            WHERE NOT EXISTS (
                SELECT 1 FROM cart_check WHERE restaurant_id != $2
            )
            ON CONFLICT (user_id, item_id) 
            DO UPDATE SET quantity = carts.quantity + 1
            RETURNING id, user_id, restaurant_id, item_id, quantity, price, created_at, updated_at, (SELECT restaurant_id FROM cart_check) AS existing_restaurant_id
        )
        SELECT id, user_id, restaurant_id, item_id, quantity, price, created_at, updated_at, existing_restaurant_id FROM upsert
        UNION ALL
        SELECT NULL::uuid AS id, $1::uuid AS user_id, $2::uuid AS restaurant_id, $3::uuid AS item_id, NULL::integer AS quantity, $4::integer AS price, NULL::timestamptz AS created_at, NULL::timestamptz AS updated_at, restaurant_id AS existing_restaurant_id
        FROM cart_check
        WHERE restaurant_id != $2 AND NOT EXISTS (SELECT 1 FROM upsert);
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
        totalQty: row.total_qty,
        totalValue: Number(row.total_value),
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


const removeFromCart = asyncHandler(async()=>{});


export {
    addToCart,
    fetchMyCart,
    removeFromCart
}