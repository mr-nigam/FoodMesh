import pool from '../config/postgre.js';


const registerRepo = async ({
    params
})=>{

    const registerQuery = `
        WITH existing AS (
            SELECT
                id,
                owner_id,
                name,
                description,
                phone,
                email,
                address,
                pictures_urls,
                is_verified,
                is_open,
                type
            FROM restaurants
            WHERE email = $4
               OR phone = $5
            LIMIT 1
        ),

        inserted AS (
            INSERT INTO restaurants(
                owner_id,
                name,
                description,
                email,
                phone,
                address,
                location,
                pictures_urls
            )
            VALUES(
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                ST_SetSRID(
                    ST_MakePoint($7, $8),
                    4326
                )::GEOGRAPHY,
                $9
            )
            ON CONFLICT DO NOTHING
            RETURNING
                id,
                owner_id,
                name,
                description,
                phone,
                email,
                address,
                pictures_urls,
                is_verified,
                is_open,
                type
        )

        SELECT * FROM inserted

        UNION ALL

        SELECT * FROM existing;
    `;

    const [rows] = await pool.query(
        registerQuery,
        params
    );

    return rows[0];
};

const fetchMyRestaurantRepo = async ({
    restaurantId
}) => {

    const searchQuery = `
        SELECT
            id,
            name,
            email,
            description,
            phone,
            address,
            pictures_urls,
            is_open,
            created_at
        FROM restaurants
        WHERE id = $1
            AND deleted_at IS NULL
        LIMIT 1;
    `;

    const { rows } = await pool.query(
        searchQuery,
        [restaurantId]
    );

    return rows[0];
};

const updateRestaurantStatusRepo = async({
    restaurantId,
    status
})=>{

    const updateQuery = `
        UPDATE restaurants
        SET 
            is_open = $1
        WHERE id = $2
            AND deleted_at IS NULL
        RETURNING
            id,
            name,
            email,
            description,
            phone,
            address,
            pictures_urls,
            is_open,
            created_at;
    `;
    
    const {rows} = await pool.query(
        updateQuery,
        [status, restaurantId]
    );


    return rows[0];
};

const updateRestaurantDetailsRepo = async ({
    restaurantId,
    restaurantName,
    description
})=>{
    
    const params = [
        restaurantName,
        description,
        restaurantId
    ];

    const updateQuery = `
        UPDATE restaurants
        SET 
            name = $1,
            description = $2
        WHERE id = $3
            AND deleted_at IS NULL
        RETURNING
            id,
            name,
            email,
            description,
            phone,
            address,
            pictures_urls,
            is_open,
            created_at;
    `;

    const {rows} = await pool.query(
        updateQuery,
        params
    );

    return rows[0];
};

const getNearbyRestaurantsRepo = async ({
    longitude,
    latitude,
    radius,
    search,
    limit = 100,
    offset = 0
}) => {

    const params = [
        longitude,
        latitude,
        radius,
        search,
        limit,
        offset
    ];
    
    const searchQuery = `
        SELECT
            id,
            name,
            description,
            pictures_urls,
            address,
            is_open,
            type,
            phone,
            ST_Distance(
                location,
                ST_SetSRID(
                    ST_MakePoint($1, $2),
                    4326
                )::geography
            ) AS distance

        FROM restaurants

        WHERE
            ST_DWithin(
                location,
                ST_SetSRID(
                    ST_MakePoint($1, $2),
                    4326
                )::geography,
                $3
            )

            AND (
                $4 = ''
                OR name ILIKE '%' || $4 || '%'
            )

        ORDER BY distance ASC
        LIMIT $5
        OFFSET $6;
    `;

    const { rows } = await pool.query(
        searchQuery,
        params
    );

    return rows;
};

const fetchSingleRestaurantRepo = async ({
    restaurantId
}) => {

    const searchQuery = `
        SELECT
            id,
            name,
            description,
            pictures_urls,
            address,
            location,
            is_open,
            created_at
        FROM restaurants
        WHERE id = $1;
    `;

    const { rows } = await pool.query(
        searchQuery,
        [restaurantId]
    );

    return rows[0];
};


export {
    registerRepo,
    fetchMyRestaurantRepo,
    updateRestaurantStatusRepo,
    updateRestaurantDetailsRepo,
    getNearbyRestaurantsRepo,
    fetchSingleRestaurantRepo
};