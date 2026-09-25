import pool from '../config/postgre.js';


const findNearbyRidersRepo = async ({
    longitude,
    latitude,
    radiusMeters = 5000,
    limit = 30
}) => {

    const params =[
        longitude,
        latitude,
        radiusMeters,
        limit
    ];

    const searchQuery = `
        SELECT
            r.id AS rider_id,
            r.user_id,
            r.name,
            r.phone,
            r.email,
            r.status,
            r.availability_status,
            ST_X(r.location::geometry) AS longitude,
            ST_Y(r.location::geometry) AS latitude,
            ST_Distance(
                r.location,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) AS distance_meters

        FROM riders r
        WHERE r.deleted_at IS NULL
          AND r.status = 'active'
          AND r.availability_status = 'online'
          AND ST_DWithin(
                r.location,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3
          )
        ORDER BY distance_meters ASC
        LIMIT $4;
    `;

    const { rows } = await pool.query(
        searchQuery,
        params
    );

    return rows;
};

const fetchRidersByIdsRepo = async ({
    riderIds
}) => {

    if(!riderIds || riderIds.length === 0){
        return [];
    }

    const searchQuery = `
        SELECT
            r.id AS rider_id,
            r.user_id,
            r.name,
            r.phone,
            r.email,
            r.status,
            r.availability_status,
            ST_X(r.location::geometry) AS longitude,
            ST_Y(r.location::geometry) AS latitude
            
        FROM riders r
        WHERE r.id = ANY($1::uuid[])
          AND r.deleted_at IS NULL
          AND r.status = 'active'
          AND r.availability_status = 'online';
    `;

    const { rows } = await pool.query(
        searchQuery, [riderIds]
    );
    
    return rows;
};


export {
    findNearbyRidersRepo,
    fetchRidersByIdsRepo
};
