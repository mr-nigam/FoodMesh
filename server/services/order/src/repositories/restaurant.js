import pool from '../config/postgre.js';


const fetchOrdersRepo = async({
    restaurantId,
    limit = 50,
    offset = 0
}) => {

    const params = [
        restaurantId,
        limit,
        offset
    ];

    const searchQuery = `
        SELECT
            o.id AS order_id,
            ort.id AS order_restaurant_id,

            o.recipient_name,
            
            COUNT(oi.item_id) AS item_count,
            SUM(oi.quantity) AS total_quantity,

            ort.subtotal,
            ort.total_amount,
            ort.discount_amount,
            ort.delivery_fee,
            ort.tax_amount,

            ort.status,
            o.created_at

        FROM order_restaurants ort

        INNER JOIN orders o
            ON o.id = ort.order_id

        INNER JOIN order_items oi
            ON  ort.id = oi.order_restaurant_id
        
        WHERE ort.restaurant_id = $1
            AND o.deleted_at IS NULL
            AND o.expire_at IS NULL
            AND o.created_at >= CURRENT_DATE
            AND o.created_at < CURRENT_DATE + INTERVAL '1 day'

        GROUP BY
            o.id,
            ort.id,
            o.recipient_name,
            ort.subtotal,
            ort.discount_amount,
            ort.delivery_fee,
            ort.tax_amount,
            ort.total_amount,
            ort.status,
            o.created_at

        ORDER BY 
            o.created_at DESC,
            ort.id DESC

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
    orderId,
    orderRestaurantId,
    restaurantId
}) => {

    const params = [
        orderId,
        orderRestaurantId,
        restaurantId
    ];

    const searchQuery = `
        SELECT
            o.id AS order_id,
            ort.id AS order_restaurant_id,

            o.recipient_name,
            ort.restaurant_id,

            ort.subtotal,
            ort.total_amount,
            ort.discount_amount,
            ort.delivery_fee,
            ort.tax_amount,
            
            ort.status,
            o.created_at,
            
            jsonb_agg(
                jsonb_build_object(
                    'item_id', oi.item_id,
                    'item_name', oi.item_name,
                    'unit_price', oi.unit_price,
                    'quantity',oi.quantity
                )
            ) AS items

        FROM order_restaurants ort

        INNER JOIN orders o
            ON o.id = ort.order_id

        INNER JOIN order_items oi
            ON  or.id = oi.order_restaurant_id
        
        WHERE o.id = $1
            AND ort.id = $2
            AND ort.restaurant_id = $3
            AND o.deleted_at IS NULL
            AND o.expire_at IS NULL

        GROUP BY
            o.id,
            ort.id,
            o.recipient_name,
            ort.restaurant_id,
            ort.subtotal,
            ort.discount_amount,
            ort.delivery_fee,
            ort.tax_amount,
            ort.total_amount,
            ort.status,
            o.created_at;
    `;

    const {rows} = await pool.query(
        searchQuery,
        params
    );

    return rows[0];
};

const updateOrderStatusRepo = async({
    status,
    orderRestaurantId,
    orderId,
    restaurantId
}) => {
    
    const params = [
        status,
        orderRestaurantId,
        orderId,
        restaurantId
    ];

    const updateQuery = `
        UPDATE order_restaurants
        SET 
            status = $1
        WHERE id = $2
            AND order_id = $3
            AND restaurant_id = $4
            AND status 
                NOT IN (
                    'delivered',
                    'cancelled',
                    'rejected',
                    'failed'
                )
        RETURNING 
            id,
            order_id;
    `;
    
    const { rows } = await pool.query(
        updateQuery,
        params
    );

    return rows[0];
};


export {
    fetchOrdersRepo,
    fetchOrderRepo,
    updateOrderStatusRepo
};