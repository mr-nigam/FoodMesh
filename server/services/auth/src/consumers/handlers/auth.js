import pool from '../../config/postgre.js';


const professionalAccountCreated = async({
    data
})=>{

    const userId = data?.userId ?? data?.id;
    const professionalId = data?.riderId ?? data?.restaurantId;

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