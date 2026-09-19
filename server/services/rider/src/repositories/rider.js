import pool from '../config/postgre.js';


const registerRepo = async({
    params
})=>{

    const insertQuery = `
        INSERT INTO riders(
            user_id,
            name,
            email,
            phone,
            aadhar_number,
            driving_license_number,
            gender,
            date_of_birth,
            location,
            profile_picture_url,
            status,
            is_verified
        )
        VALUES(
            $1, $2, $3,
            $4, $5, $6,
            $7, $8,
            ST_SetSRID(
                ST_MakePoint($9, $10),
                4326
            )::geography,
            $11,
            'active',
            TRUE
        )
        RETURNING
            id,
            user_id,
            name,
            email,
            phone,
            aadhar_number,
            driving_license_number,
            profile_picture_url,
            gender,
            date_of_birth,
            status,
            availability_status,
            is_verified,
            ST_X(location::geometry) AS longitude,
            ST_Y(location::geometry) AS latitude,
            created_at;
    `;

    const {rows} = await pool.query(
        insertQuery,
        params
    );

    return rows[0];
};

const fetchProfileRepo = async({
    riderId
})=>{

    const searchQuery = `
        SELECT
            r.id AS rider_id,
            r.id,
            r.user_id,
            r.name,
            r.phone,
            r.email,
            r.aadhar_number,
            r.driving_license_number,
            r.profile_picture_url,
            r.gender,
            r.date_of_birth,
            r.status,
            r.availability_status,
            ST_X(r.location::geometry) AS longitude,
            ST_Y(r.location::geometry) AS latitude,
            r.location_updated_at,
            r.last_seen_at,
            r.is_verified,
            r.verified_at,
            r.created_at,

            (
                SELECT COUNT(*)
                FROM vehicles v
                WHERE v.rider_id = r.id
                    AND v.deleted_at IS NULL
            ) AS vehicles_count

        FROM riders r
        WHERE r.id = $1
            AND r.deleted_at IS NULL;
    `;

    const {rows} = await pool.query(
        searchQuery,
        [riderId]
    );

    return rows[0];
};

const updateAvailabilityStatusRepo = async({
    riderId,
    availabilityStatus
})=>{

    const params = [
        availabilityStatus,
        riderId
    ];

    const updateQuery = `
        UPDATE riders
        SET
            availability_status = $1,
            last_seen_at = CURRENT_TIMESTAMP
        WHERE id = $2
            AND deleted_at IS NULL
            AND status != 'blocked'
            AND status != 'deactivated'
            AND availability_status != 'busy'
        RETURNING
            id AS rider_id,
            id,
            user_id,
            availability_status,
            status,
            ST_X(location::geometry) AS longitude,
            ST_Y(location::geometry) AS latitude;
    `;

    const {rows} = await pool.query(
        updateQuery,
        params
    );

    return rows[0];
};

const updateLocationRepo = async({
    riderId,
    longitude,
    latitude
})=>{
    
    const params = [
        longitude,
        latitude,
        riderId
    ];

    const updateQuery = `
        UPDATE riders
        SET
            location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            location_updated_at = CURRENT_TIMESTAMP,
            last_seen_at = CURRENT_TIMESTAMP
        WHERE id = $3
            AND deleted_at IS NULL
        RETURNING
            id AS rider_id,
            ST_X(location::geometry) AS longitude,
            ST_Y(location::geometry) AS latitude,
            location_updated_at;
    `;

    const {rows} = await pool.query(
        updateQuery,
        params
    );

    return rows[0];
};


export {
    registerRepo,
    fetchProfileRepo,
    updateAvailabilityStatusRepo,
    updateLocationRepo
};