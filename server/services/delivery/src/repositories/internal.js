import pool from '../config/postgre.js';


const createDeliveryRepo = async ({
    params
}) => {

    const insertQuery = `
        INSERT INTO deliveries (
            order_id,
            restaurant_order_id,
            user_id,

            restaurant_id,
            restaurant_name,
            restaurant_address,

            recipient_name,
            recipient_phone,
            delivery_address,

            pickup_location,
            drop_location,

            aerial_distance_meters,
            estimated_distance_meters,
            estimated_duration_seconds
        )
        VALUES (
            $1, $2, $3,
            $4, $5, $6,
            $7, $8, $9,

            ST_SetSRID(
                ST_MakePoint($10, $11),
                4326
            )::geography,

            ST_SetSRID(
                ST_MakePoint($12, $13),
                4326
            )::geography,

            ST_Distance(
                ST_SetSRID(
                    ST_MakePoint($10, $11),
                    4326
                )::geography,

                ST_SetSRID(
                    ST_MakePoint($12, $13),
                    4326
                )::geography
            ),

            $14,
            $15
        )
        ON CONFLICT (restaurant_order_id)
        DO UPDATE SET
            updated_at = CURRENT_TIMESTAMP
        RETURNING
            id AS delivery_id,
            order_id,
            restaurant_order_id,
            user_id,

            restaurant_id,
            restaurant_name,
            restaurant_address,

            recipient_name,
            recipient_phone,
            delivery_address,

            ST_X(pickup_location::geometry) AS pickup_longitude,
            ST_Y(pickup_location::geometry) AS pickup_latitude,

            ST_X(drop_location::geometry) AS drop_longitude,
            ST_Y(drop_location::geometry) AS drop_latitude,

            aerial_distance_meters,
            estimated_distance_meters,
            estimated_duration_seconds,

            status,
            rider_id,
            created_at;
    `;

    const { rows } = await pool.query(
        insertQuery,
        params
    );

    return rows[0];
};

const getDeliveryRepo = async ({
    orderId,
    orderRestaurantId
}) => {

    const params = [
        orderId,
        orderRestaurantId
    ];

    const searchQuery = `
        SELECT
            id AS delivery_id,
            order_id,
            restaurant_order_id,
            user_id,

            restaurant_id,
            restaurant_name,
            restaurant_address,

            recipient_name,
            recipient_phone,
            delivery_address,

            ST_X(pickup_location::geometry) AS pickup_longitude,
            ST_Y(pickup_location::geometry) AS pickup_latitude,

            ST_X(drop_location::geometry) AS drop_longitude,
            ST_Y(drop_location::geometry) AS drop_latitude,

            aerial_distance_meters,
            estimated_distance_meters,
            estimated_duration_seconds,

            status,
            rider_id,
            created_at

        FROM deliveries
        WHERE order_id = $1
            AND restaurant_order_id = $2
        LIMIT 1;
    `;

    const { rows } = await pool.query(
        searchQuery,
        params
    );

    return rows[0];
};

const getDeliveryByIdRepo  = async({
    deliveryId
})=>{

    const searchQuery = `
        SELECT
            id AS delivery_id,
            order_id,
            restaurant_order_id,
            user_id,

            restaurant_id,
            restaurant_name,
            restaurant_address,

            recipient_name,
            recipient_phone,
            delivery_address,

            ST_X(pickup_location::geometry) AS pickup_longitude,
            ST_Y(pickup_location::geometry) AS pickup_latitude,

            ST_X(drop_location::geometry) AS drop_longitude,
            ST_Y(drop_location::geometry) AS drop_latitude,

            aerial_distance_meters,
            estimated_distance_meters,
            estimated_duration_seconds,

            status,
            rider_id,
            created_at

        FROM deliveries
        WHERE id = $1
        LIMIT 1;
    `;

    const {rows} = await pool.query(
        searchQuery,
        [deliveryId]
    );

    return rows[0];
};

const createDeliveryOffersRepo = async({
    deliveryId,
    riderId,
    expiresAt
})=>{

    const defaultExpiry = new Date(Date.now() + 15000);

    const params = [
        deliveryId,
        riderId,
        expiresAt || defaultExpiry
    ];

    const insertQuery = `
        INSERT INTO delivery_offers(
            delivery_id,
            rider_id,
            expires_at
        )
        VALUES(
            $1, $2, $3
        )
        ON CONFLICT (delivery_id, rider_id)
        DO UPDATE SET
            status = 'offered',
            expires_at = EXCLUDED.expires_at,
            offered_at = CURRENT_TIMESTAMP
        RETURNING
            id AS delivery_offer_id,
            rider_id,
            delivery_id,
            status,
            expires_at,
            offered_at;
    `;

    const {rows} = await pool.query(
        insertQuery,
        params
    );

    return rows[0];
};

const batchCreateDeliveryOffersRepo = async({
    deliveryId,
    riderIds,
    expiresAt
})=>{

    if(
        !riderIds || 
        riderIds.length === 0
    ) return [];

    const defaultExpiry = new Date(Date.now() + 15000);
    const expiry = expiresAt || defaultExpiry;
    
    const values = [];
    const placeholders = [];

    riderIds.forEach((riderId, idx) => {
        const offset = idx * 3;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
        values.push(deliveryId, riderId, expiry);
    });

    const insertQuery = `
        INSERT INTO delivery_offers(
            delivery_id,
            rider_id,
            expires_at
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (delivery_id, rider_id)
        DO UPDATE SET
            status = 'offered',
            expires_at = EXCLUDED.expires_at,
            offered_at = CURRENT_TIMESTAMP
        RETURNING
            id AS delivery_offer_id,
            rider_id,
            delivery_id,
            status,
            expires_at,
            offered_at;
    `;

    const { rows } = await pool.query(
        insertQuery,
        values
    );
    
    return rows;
};

const expireDeliveryOffersRepo = async ({
    offerIds
}) => {

    if(
        !offerIds ||
        offerIds.length === 0
    ) return [];
    
    const updateQuery = `
        UPDATE delivery_offers
        SET 
            status = 'expired'
        WHERE id = ANY($1::uuid[])
          AND status = 'offered'
        RETURNING 
            id AS delivery_offer_id,
            rider_id,
            delivery_id;
    `;

    const { rows } = await pool.query(
        updateQuery,
        [offerIds]
    );
    
    return rows;
};

const updateDeliveryOverallStatusRepo = async ({
    deliveryId,
    status
}) => {

    const updateQuery = `
        UPDATE deliveries
        SET status = $1
        WHERE id = $2;
    `;
    
    await pool.query(
        updateQuery, 
        [status, deliveryId]
    );
    
    return true;
};


export{
    createDeliveryRepo,
    getDeliveryRepo,
    getDeliveryByIdRepo,
    createDeliveryOffersRepo,
    batchCreateDeliveryOffersRepo,
    expireDeliveryOffersRepo,
    updateDeliveryOverallStatusRepo
};