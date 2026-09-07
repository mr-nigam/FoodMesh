import pool from '../config/postgre.js';


const CPIPaymentTableRepo = async({
    userId,
    orderId,
    amount,
    currency,
}) => {

    const values = [
        userId,
        orderId,
        amount,
        currency,
        "pending"
    ];
    
    const insertQuery = `
        INSERT INTO payments(
            user_id,
            order_id,
            amount,
            currency,
            status
        )
        VALUES(
            $1, $2, $3, $4, $5
        )
        RETURNING
            id,
            user_id,
            order_id
            amount,
            currency,
            status;
    `;

    const {rows} = await pool.query(
        insertQuery,
        values
    );

    return rows[0];
};

const fetchPaymentDetailsRepo = async({
    userId,
    orderId
}) => {

    const searchQuery = `
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

    const { rows } = await pool.query(
        searchQuery, 
        [orderId, userId]
    );

    return rows[0];
};

const CPIPaymentAttemptsTableRepo = async({
    paymentId,
    providerName,
    status,
    amount,
    currency,
    providerOrderId   
}) =>{
    
    const values = [
        paymentId,
        providerName,
        status,
        amount,
        currency,
        providerOrderId 
    ];

    const insertQuery = `
        INSERT INTO payment_attempts(
            payment_id,
            provider_name,
            status,
            amount,
            currency,
            provider_order_id
        )
        VALUES (
            $1, $2, $3,
            $4, $5, $6
        )
        RETURNING
            id,
            payment_id,
            provider_name,
            status,
            amount,
            currency,
            provider_order_id;
    `;

    const {rows} = pool.query(
        insertQuery,
        values
    );

    return rows[0];
};
const CPIPaymentOutboxsTableRepo = async({}) =>{};


export {
    CPIPaymentTableRepo,
    fetchPaymentDetailsRepo,
    CPIPaymentAttemptsTableRepo,
    CPIPaymentOutboxsTableRepo
};