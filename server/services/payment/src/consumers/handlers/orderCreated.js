import pool from '../../config/postgre.js';


const handleOrderCreated = async (payload) => {
    console.log("handler-1");

    
    const eventData = payload?.eventData || payload;

    if(!eventData || !eventData.orderId){
        console.error("[Payment Service] Invalid event payload received:", payload);
        return null;
    }

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
            order_id,
            amount,
            currency,
            status;
    `;

    let newPayment = null;

    try {
        const { rows } = await pool.query(
            insertQuery,
            values
        );

        newPayment = rows[0];
        console.log(`[Payment Service] Created pending payment record: ${newPayment?.id} for order: ${orderId}`);
    
    }catch(error){
        
        if(error.code === "23505"){
            console.warn(`[Payment Service] Unique violation caught for order_id: ${orderId}`);
            return null;
        }

        console.error(`[Payment Service] Error creating payment for order ${orderId}:`, error);
        throw error;
    }

    console.log("handler-2");
    return newPayment;
};


export {
    handleOrderCreated
};