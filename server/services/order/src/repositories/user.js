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

            COUNT(ro.id) AS restaurant_count,

            jsonb_agg(
                jsonb_build_object(
                    'id', ro.restaurant_id,
                    'name', ro.restaurant_name
                )
                ORDER BY ro.id ASC
            ) AS restaurants

        FROM orders AS o

        INNER JOIN restaurant_orders AS ro
            ON ro.order_id = o.id

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

            jsonb_agg(
                jsonb_build_object(
                    'restaurant_order_id', ro.id,

                    'restaurant_id', ro.restaurant_id,
                    'name', ro.restaurant_name,
                    'phone', ro.restaurant_phone,

                    'longitude', ST_X(ro.restaurant_location::geometry),
                    'latitude', ST_Y(ro.restaurant_location::geometry),

                    'address', ro.restaurant_address,

                    'subtotal', ro.subtotal,
                    'tax_amount', ro.tax_amount,
                    'delivery_fee', ro.delivery_fee,
                    'discount_amount', ro.discount_amount,
                    'total_amount', ro.total_amount,

                    'status', ro.status,

                    'ordered_items',
                    (
                        SELECT
                            jsonb_agg(
                                jsonb_build_object(
                                    'item_order_id', oi.id,
                                    'id', oi.item_id,
                                    'cart_id', oi.cart_id,
                                    'item_name', oi.item_name,
                                    'unit_price', oi.unit_price,
                                    'quantity', oi.quantity,
                                    'subtotal', oi.subtotal
                                )
                                ORDER BY oi.id ASC
                            )
                        FROM order_items AS oi
                        WHERE oi.restaurant_order_id = ro.id
                    )
                )
                ORDER BY ro.id ASC
            ) AS restaurants

        FROM orders AS o

        JOIN restaurant_orders AS ro
            ON o.id = ro.order_id

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
            o.created_at;
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

    const cancelQuery = `
        WITH order_details AS (
            UPDATE orders
            SET 
                status = 'cancelled'
            WHERE id = $1
            AND user_id = $2
            AND deleted_at IS NULL
            AND status NOT IN (
                'partially_delivered',
                'cancelled',
                'delivered',
                'rejected',
                'failed'
            )
            RETURNING id
        ),

        restaurants_order_details AS (
            UPDATE restaurant_orders
            SET 
                status = 'cancelled'
            WHERE order_id = $1
            AND user_id = $2
            AND status NOT IN (
                'cancelled',
                'delivered'
            )
            RETURNING restaurant_id
        )

        SELECT
            ARRAY_AGG(rod.restaurant_id) AS restaurant_ids
        FROM order_details od
        LEFT JOIN restaurants_order_details rod
            ON TRUE
        GROUP BY od.id;
    `;

    const {rows} = await pool.query(
        cancelQuery,
        params
    );

    return rows[0]?.restaurant_ids;
};


export {
    fetchOrdersRepo,
    fetchOrderRepo,
    cancelOrderRepo
};