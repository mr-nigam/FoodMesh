import pool from '../config/postgre.js';


const addVehicleRepo = async({
    riderId,
    vehicleType,
    manufacturer,
    model,
    color,
    registrationNumber,
    registrationExpiryDate,
    isPrimary
})=>{
    
    if(isPrimary){
        await pool.query(`
            UPDATE vehicles
            SET is_primary = FALSE
            WHERE rider_id = $1
              AND deleted_at IS NULL;
        `, [riderId]);
    }

    const insertQuery = `
        INSERT INTO vehicles(
            rider_id,
            vehicle_type,
            manufacturer,
            model,
            color,
            registration_number,
            registration_expiry_date,
            is_primary,
            verification_status
        )
        VALUES(
            $1, $2, $3, $4, $5, $6, $7, $8, 'verified'
        )
        RETURNING
            id,
            rider_id,
            vehicle_type,
            manufacturer,
            model,
            color,
            registration_number,
            registration_expiry_date,
            is_primary,
            verification_status,
            created_at;
    `;

    const {rows} = await pool.query(insertQuery, [
        riderId,
        vehicleType,
        manufacturer || null,
        model || null,
        color || null,
        registrationNumber || null,
        registrationExpiryDate || null,
        Boolean(isPrimary)
    ]);

    return rows[0];
};

const fetchVehiclesRepo = async({
    riderId
})=>{
    const {rows} = await pool.query(`
        SELECT
            id,
            rider_id,
            vehicle_type,
            manufacturer,
            model,
            color,
            registration_number,
            registration_expiry_date,
            is_primary,
            verification_status,
            created_at
        FROM vehicles
        WHERE rider_id = $1
          AND deleted_at IS NULL
        ORDER BY is_primary DESC, created_at DESC;
    `, [riderId]);

    return rows;
};

const setPrimaryVehicleRepo = async({
    riderId,
    vehicleId
})=>{
    await pool.query(`
        UPDATE vehicles
        SET is_primary = FALSE
        WHERE rider_id = $1
          AND deleted_at IS NULL;
    `, [riderId]);

    const {rows} = await pool.query(`
        UPDATE vehicles
        SET is_primary = TRUE
        WHERE id = $1
          AND rider_id = $2
          AND deleted_at IS NULL
        RETURNING *;
    `, [vehicleId, riderId]);

    return rows[0];
};


export {
    addVehicleRepo,
    fetchVehiclesRepo,
    setPrimaryVehicleRepo
};