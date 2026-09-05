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

const CPIPaymentAttemptsTableRepo = async({}) =>{}
const CPIPaymentOutboxsTableRepo = async({}) =>{}


export {
    CPIPaymentTableRepo,
    CPIPaymentAttemptsTableRepo,
    CPIPaymentOutboxsTableRepo
};