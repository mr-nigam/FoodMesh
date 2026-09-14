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
            AND ort.status IN(
                'placed',
                'created',
                'confirmed',
                'accepted',
                'preparing',
                'ready',
                'rider_assigned'
            )
        
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

        ORDER BY o.created_at DESC, ort.id DESC

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
            or.id AS order_restaurant_id,

            o.recipient_name,
            or.restaurant_id,

            or.subtotal,
            or.total_amount,
            or.discount_amount,
            or.delivery_fee,
            or.tax_amount,
            
            or.status,
            o.created_at,
            
            jsonb_agg(
                jsonb_build_object(
                    'item_id', oi.item_id,
                    'item_name', oi.item_name,
                    'unit_price', oi.unit_price,
                    'quantity',oi.quantity
                )
            ) AS items

        FROM order_restaurants or

        INNER JOIN orders o
            ON o.id = or.order_id

        INNER JOIN order_items oi
            ON  or.id = oi.order_restaurant_id
        
        WHERE o.id = $1
            AND or.id = $2
            AND or.restaurant_id = $3
            AND o.deleted_at IS NULL
            AND o.expire_at IS NULL

        GROUP BY
            o.id,
            or.id,
            o.recipient_name,
            or.restaurant_id,
            or.subtotal,
            or.discount_amount,
            or.delivery_fee,
            or.tax_amount,
            or.total_amount,
            or.status,
            o.created_at;
    `;

    const {rows} = await pool.query(
        searchQuery,
        params
    );

    return rows[0];
};

// check it
const updateOrderStatusRepo = async({
    status,
    orderRestaurantId,
    orderId,
    restaurantId
}) => {
    let updateQuery;
    let params;

    if(orderRestaurantId){
        params = [status, orderRestaurantId];
        let whereExtra = '';
        if(orderId){
            params.push(orderId);
            whereExtra += ` AND order_id = $${params.length}`;
        }
        if (restaurantId) {
            params.push(restaurantId);
            whereExtra += ` AND restaurant_id = $${params.length}`;
        }

        updateQuery = `
            UPDATE order_restaurants
            SET status = $1
            WHERE id = $2
                ${whereExtra}
                AND status NOT IN ('delivered', 'cancelled', 'rejected', 'failed')
            RETURNING 
                id,
                order_id,
                restaurant_id,
                status,
                user_id,
                total_amount,
                subtotal;
        `;
    } else {
        params = [status, orderId, restaurantId];
        updateQuery = `
            UPDATE order_restaurants
            SET status = $1
            WHERE order_id = $2
                AND restaurant_id = $3
                AND status NOT IN ('delivered', 'cancelled', 'rejected', 'failed')
            RETURNING 
                id,
                order_id,
                restaurant_id,
                status,
                user_id,
                total_amount,
                subtotal;
        `;
    }

    const { rows } = await pool.query(updateQuery, params);
    return rows[0];
};


export {
    fetchOrdersRepo,
    fetchOrderRepo,
    updateOrderStatusRepo
};