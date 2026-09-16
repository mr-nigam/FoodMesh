import pool from 
'../config/postgre.js';


const fetchOrdersRepo = async({
    userId,
    limit = 20,
    offset = 0
}) => {

    const params = [
        userId,
        limit,
        offset
    ];

    const searchQuery = `
        SELECT
            o.id AS order_id,
            o.recipient_name,
            o.status,
            o.total_amount,
            o.created_at,

            COUNT(orr.id) AS restaurant_count,

            jsonb_agg(
                jsonb_build_object(
                    'id', orr.restaurant_id,
                    'name', orr.restaurant_name
                )
                ORDER BY orr.id ASC
            ) AS restaurants

        FROM orders AS o

        INNER JOIN order_restaurants AS orr
            ON orr.order_id = o.id

        WHERE o.user_id = $1
            AND o.deleted_at IS NULL

        GROUP BY
            o.id,
            o.recipient_name,
            o.status,
            o.total_amount,
            o.created_at

        ORDER BY
            o.created_at DESC,
            o.id DESC

        LIMIT $2
        OFFSET $3;
    `;

    const {rows} = await pool.query(
        searchQuery,
        params
    );
    
    return rows;
};

const fetchOrderRepo = async({
    userId,
    orderId
}) => {

    const params = [orderId, userId];

    const searchQuery = `
        SELECT
            o.id AS order_id,

            o.recipient_name,
            o.recipient_phone,
            o.delivery_address,
            
            o.status,

            o.subtotal,
            o.delivery_fee,
            o.tax_amount,
            o.discount_amount,
            o.total_amount,

            o.created_at,

            jsonb_build_object(
                'order_restaurant_id', orr.id,

                'id', orr.restaurant_id,
                'name', orr.restaurant_name,
                
                'phone', orr.restaurant_phone,
                'location', orr.restaurant_location,
                'address', orr.restaurant_address,
                
                'subtotal', orr.subtotal,
                'tax_amount', orr.tax_amount,
                'delivery_fee', orr.delivery_fee,
                'discount_amount', orr.discount_amount,
                'total_amount', orr.total_amount,
                
                'status', orr.status
            ) AS restaurant,

            jsonb_agg(
                jsonb_build_object(
                    'order_item_id', oi.id,
                    'id', oi.item_id,
                    'cart_id', oi.cart_id,
                    'item_name', oi.item_name,
                    'unit_price', oi.unit_price,
                    'quantity', oi.quantity,
                    'subtotal', oi.subtotal
                )
                ORDER BY oi.id ASC
            ) as ordered_items

        FROM orders AS o

        INNER JOIN order_restaurants orr
            ON o.id = orr.order_id

        INNER JOIN order_items oi
            ON orr.id = oi.order_restaurant_id

        WHERE o.id = $1
            AND o.user_id = $2
            AND o.deleted_at IS NULL

        GROUP BY
            o.id,
            o.recipient_name,
            o.recipient_phone,
            o.delivery_address,
            o.status,
            o.subtotal,
            o.delivery_fee,
            o.tax_amount,
            o.discount_amount,
            o.total_amount,

            orr.id,
            orr.restaurant_id,
            orr.restaurant_name,
            orr.restaurant_phone,
            orr.restaurant_location,
            orr.restaurant_address,
            orr.subtotal,
            orr.tax_amount,
            orr.delivery_fee,
            orr.discount_amount,
            orr.total_amount,
            orr.status;
    `;

    const {rows} = await pool.query(
        searchQuery,
        params
    );

    return rows[0];
};

const cancelOrderRepo = async({
    orderId,
    userId
})=>{

    const params = [orderId, userId];

    const deleteQuery = `
        WITH order_details AS (
            UPDATE orders
            SET status = 'cancelled'
            WHERE id = $1
            AND user_id = $2
            AND deleted_at IS NULL
            AND status NOT IN (
                'cancelled',
                'delivered',
                'rejected',
                'failed'
            )
            RETURNING id
        ),

        order_restaurants_details AS (
            UPDATE order_restaurants
            SET status = 'cancelled'
            WHERE order_id = $1
            AND user_id = $2
            AND status NOT IN (
                'cancelled',
                'delivered',
                'rejected',
                'failed'
            )
            RETURNING restaurant_id
        )

        SELECT
            ARRAY_AGG(ord.restaurant_id) AS restaurant_ids
        FROM order_details od
        LEFT JOIN order_restaurants_details ord
            ON TRUE
        GROUP BY od.id;
    `;

    const {rows} = await pool.query(
        deleteQuery,
        params
    );

    return rows[0]?.restaurant_ids;
};


export {
    fetchOrdersRepo,
    fetchOrderRepo,
    cancelOrderRepo
};