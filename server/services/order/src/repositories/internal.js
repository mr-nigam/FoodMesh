import pool from '../config/postgre.js';

const fetchOrderForPaymentRepo = async ({
    orderId,
    userId
}) => {
    const query = `
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

    const { rows } = await pool.query(query, [orderId, userId]);
    return rows[0] || null;
};

export {
    fetchOrderForPaymentRepo
};
