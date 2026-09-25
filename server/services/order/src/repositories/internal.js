import pool from '../config/postgre.js';


const fetchOrderRepo = async ({
    orderId,
    userId
}) => {

    const searchQuery = `
        SELECT 
            id,
            user_id,
            recipient_name,
            recipient_phone,
            delivery_address,
            status,
            subtotal,
            delivery_fee,
            tax_amount,
            discount_amount,
            total_amount,
            created_at,
            updated_at
        FROM orders
        WHERE id = $1
          AND user_id = $2
        LIMIT 1;
    `;

    const { rows } = await pool.query(
        searchQuery, 
        [orderId, userId]
    );
    
    return rows[0] || null;
};

const getOrdersForStatusUpdate = async({
    orderId
})=>{

    const searchQuery = `
        SELECT 
            status
        FROM order_restaurants
        WHERE order_id = $1;
    `;

    const {rows} = await pool.query(
        searchQuery,
        [orderId]
    );

    return rows;
};

const updateOrderStatusRepo = async({
    orderId,
    status
})=>{
    
    const updateQuery = `
        UPDATE orders
            SET status = $1
        WHERE id = $2
            AND deleted_at IS NULL
            AND status NOT IN(
                'cancelled',
                'rejected',
                'failed',
                'delivered'
            )
        RETURNING
            status;
    `;

    const {rows} = await pool.query(
        updateQuery,
        [status, orderId]
    );

    return rows[0];
};

const fetchRestaurantOrderRepo = async({
    orderId,
    orderRestaurantId
})=>{

    const params = [
        orderId,
        orderRestaurantId
    ];

    const searchQuery = `
        SELECT
            o.user_id,
            orr.order_id AS order_id,
            orr.id AS order_restaurant_id,

            o.recipient_name,
            o.recipient_phone,
            o.delivery_address,

            orr.restaurant_id,
            orr.restaurant_name,
            orr.restaurant_phone,

            ST_X(orr.restaurant_location::geometry) as pickup_longitude,
            ST_Y(orr.restaurant_location::geometry) as pickup_latitude,

            orr.restaurant_address,
            orr.created_at

        FROM orders o

        INNER JOIN order_restaurants orr
            ON o.id = orr.order_id

        WHERE o.id = $1
            AND orr.id = $2
            AND o.deleted_at IS NULL
            AND orr.status IN (
                'created',
                'confirmed',
                'accepted',
                'preparing',
                'ready'        
            );
    `;

    const {rows} = await pool.query(
        searchQuery,
        params
    );
    
    return rows[0];
};


export {
    fetchOrderRepo,
    getOrdersForStatusUpdate,
    updateOrderStatusRepo,
    fetchRestaurantOrderRepo
};
