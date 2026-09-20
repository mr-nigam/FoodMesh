import pool from '../../config/postgre.js';


const professionalAccountCreated = async(payload)=>{

    const eventData = payload?.eventData || payload;

    if(
        !eventData || 
        !eventData.orderId
    ){
        console.error("[Payment Service] Invalid event payload received:", payload);
        return null;
    }

    const { 
        userId,
        professionalId
    } = eventData;


    const updateQuery = `
        UPDATE users
            SET professional_id = $1
        WHERE id = $2
            AND deleted_at IS NULL;
    `;

    await pool.query(
        updateQuery,
        [professionalId, userId]
    );
};


export {
    professionalAccountCreated
};