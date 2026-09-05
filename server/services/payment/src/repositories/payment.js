import pool from '../config/postgre.js';


const fetchOrderForPaymentRepo = async({
    userId,
    orderId
}) => {
    const query = `
        SELECT 
            id,
            user_id,
            order_id,
            amount,
            currency,
            status,
            created_at,
            updated_at
        FROM payments
        WHERE order_id = $1
          AND user_id = $2
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [orderId, userId]);
    return rows[0] || null;
};

export {
    fetchOrderForPaymentRepo
};