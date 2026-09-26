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
        FROM restaurant_orders
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
    restaurantOrderId
})=>{

    const params = [
        orderId,
        restaurantOrderId
    ];

    const searchQuery = `
        SELECT
            o.user_id,
            ro.order_id AS order_id,
            ro.id AS restaurant_order_id,

            o.recipient_name,
            o.recipient_phone,
            o.delivery_address,

            ro.restaurant_id,
            ro.restaurant_name,
            ro.restaurant_phone,

            ST_X(ro.restaurant_location::geometry) as pickup_longitude,
            ST_Y(ro.restaurant_location::geometry) as pickup_latitude,

            ro.restaurant_address,
            ro.created_at

        FROM orders o

        INNER JOIN restaurant_orders ro
            ON o.id = ro.order_id

        WHERE o.id = $1
            AND ro.id = $2
            AND o.deleted_at IS NULL
            AND ro.status IN (
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

const deliveryUpdateRepo = async({
    orderId,
    restaurantOrderId,
    status
})=>{

    const params =[
        status,
        restaurantOrderId,
        orderId
    ];

    const updateQuery = `
        UPDATE restaurant_orders
        SET status = $1
        WHERE id = $2
            AND order_id = $3
            AND status IN (
                'ready',
                'rider_assigned',
                'picked_up',
                'on_the_way'
            )
        RETURNING
            restaurant_id;
    `;

    const {rows} = await pool.query(
        updateQuery,
        params
    );

    return rows[0];
};


export {
    fetchOrderRepo,
    getOrdersForStatusUpdate,
    updateOrderStatusRepo,
    fetchRestaurantOrderRepo,
    deliveryUpdateRepo
};
