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
            ro.id AS restaurant_order_id,

            o.recipient_name,
            
            COUNT(oi.item_id) AS item_count,
            SUM(oi.quantity) AS total_quantity,

            ro.subtotal,
            ro.total_amount,
            ro.discount_amount,
            ro.delivery_fee,
            ro.tax_amount,

            ro.status,
            o.created_at

        FROM restaurant_orders ro

        INNER JOIN orders o
            ON o.id = ro.order_id

        INNER JOIN order_items oi
            ON  ro.id = oi.restaurant_order_id
        
        WHERE ro.restaurant_id = $1
            AND o.deleted_at IS NULL

        GROUP BY
            o.id,
            ro.id,
            o.recipient_name,
            ro.subtotal,
            ro.discount_amount,
            ro.delivery_fee,
            ro.tax_amount,
            ro.total_amount,
            ro.status,
            o.created_at

        ORDER BY 
            o.created_at DESC,
            ro.id DESC

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
    restaurantId
}) => {

    const params = [
        orderId,
        restaurantId
    ];

    const searchQuery = `
        SELECT
            o.id AS order_id,
            ro.id AS restaurant_order_id,

            o.recipient_name,
            ro.restaurant_id,

            ro.subtotal,
            ro.total_amount,
            ro.discount_amount,
            ro.delivery_fee,
            ro.tax_amount,
            
            ro.status,
            o.created_at,
            
            jsonb_agg(
                jsonb_build_object(
                    'item_id', oi.item_id,
                    'item_name', oi.item_name,
                    'unit_price', oi.unit_price,
                    'quantity', oi.quantity,
                    'subtotal', oi.subtotal
                )
                ORDER BY oi.id ASC
            ) AS items

        FROM restaurant_orders ro

        INNER JOIN orders o
            ON o.id = ro.order_id

        INNER JOIN order_items oi
            ON ro.id = oi.restaurant_order_id
        
        WHERE o.id = $1
            AND ro.restaurant_id = $2
        AND o.deleted_at IS NULL

        GROUP BY
            o.id,
            ro.id,
            o.recipient_name,
            ro.restaurant_id,
            ro.subtotal,
            ro.discount_amount,
            ro.delivery_fee,
            ro.tax_amount,
            ro.total_amount,
            ro.status,
            o.created_at;
    `;

    const {rows} = await pool.query(
        searchQuery,
        params
    );

    return rows[0];
};

const updateRestaurantOrderStatusRepo = async({
    status,
    restaurantOrderId,
    orderId,
    restaurantId
}) => {
    
    const params = [
        status,
        restaurantOrderId,
        orderId,
        restaurantId
    ];

    const updateQuery = `
        UPDATE restaurant_orders
        SET
            status = $1
        WHERE id = $2
            AND order_id = $3
            AND restaurant_id = $4
        RETURNING
            user_id;
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
    updateRestaurantOrderStatusRepo
};