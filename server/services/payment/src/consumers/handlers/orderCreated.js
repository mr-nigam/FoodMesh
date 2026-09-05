import pool from '../config/postgre.js';


const handleOrderCreated = async ({
    eventData
}) => {
    const { 
        orderId,
        userId,
        totalAmount 
    } = eventData;

    const values = [
        userId,
        orderId,
        totalAmount,
        "INR",
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

    let rows;
    try{
        
        rows = await pool.query(
            insertQuery,
            values
        );

    }catch(error){
        if(error.statusCode === "23505"){
            console.warn(`[Payment Service] Unique violation caught for order_id: ${orderId}`);
        }

        console.error(`[Payment Service] Error creating payment for order ${orderId}:`, error);
    }

    const newPayment = rows[0];
    console.log(`[Payment Service] Created pending payment record: ${newPayment.id} for order: ${orderId}`);
    
    // Optional: Trigger payment gateway flow or publish payment.created event here

    return newPayment;
};


export {
    handleOrderCreated
};