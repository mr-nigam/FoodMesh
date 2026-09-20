import pool from '../config/postgre.js';


const fetchOrderForPaymentRepo = async ({
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


export {
    fetchOrderForPaymentRepo,
    getOrdersForStatusUpdate,
    updateOrderStatusRepo
};
