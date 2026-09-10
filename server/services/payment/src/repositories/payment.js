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
            order_id,
            amount,
            currency,
            status;
    `;

    const { rows } = await pool.query(
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

const fetchPaymentByIdRepo = async({
    paymentId
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
        WHERE id = $1
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [paymentId]);
    return rows[0] || null;
};

const updatePaymentStatusRepo = async({
    paymentId,
    status
}) => {
    const updateQuery = `
        UPDATE payments
        SET status = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *;
    `;
    const { rows } = await pool.query(updateQuery, [status, paymentId]);
    return rows[0] || null;
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

    const { rows } = await pool.query(
        insertQuery,
        values
    );

    return rows[0];
};

const fetchPaymentAttemptByIdRepo = async({
    paymentAttemptId
}) => {
    const query = `
        SELECT 
            id,
            payment_id,
            provider_name,
            status,
            amount,
            currency,
            provider_order_id,
            provider_payment_id,
            failure_code,
            failure_message,
            created_at,
            updated_at
        FROM payment_attempts
        WHERE id = $1
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [paymentAttemptId]);
    return rows[0] || null;
};

const updatePaymentAttemptRepo = async({
    paymentAttemptId,
    status,
    providerPaymentId,
    failureCode,
    failureMessage
}) => {
    const updateQuery = `
        UPDATE payment_attempts
        SET status = $1,
            provider_payment_id = COALESCE($2, provider_payment_id),
            failure_code = COALESCE($3, failure_code),
            failure_message = COALESCE($4, failure_message),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *;
    `;

    const { rows } = await pool.query(updateQuery, [
        status,
        providerPaymentId || null,
        failureCode || null,
        failureMessage || null,
        paymentAttemptId
    ]);

    return rows[0] || null;
};

const CPIPaymentOutboxsTableRepo = async({
    paymentId,
    eventType,
    payload
}) =>{
    const insertQuery = `
        INSERT INTO payment_outbox(
            payment_id,
            event_type,
            payload,
            status
        )
        VALUES ($1, $2, $3, 'pending')
        RETURNING *;
    `;

    const { rows } = await pool.query(insertQuery, [
        paymentId,
        eventType,
        JSON.stringify(payload)
    ]);

    return rows[0];
};


export {
    CPIPaymentTableRepo,
    fetchPaymentDetailsRepo,
    fetchPaymentByIdRepo,
    updatePaymentStatusRepo,
    CPIPaymentAttemptsTableRepo,
    fetchPaymentAttemptByIdRepo,
    updatePaymentAttemptRepo,
    CPIPaymentOutboxsTableRepo
};