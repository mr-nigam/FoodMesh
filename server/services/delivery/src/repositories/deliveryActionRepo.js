import pool from '../config/postgre.js';


const acceptDeliveryOfferRepo = async({
    offerId,
    riderId,
    deliveryId
})=>{

    const params = [
        offerId,
        deliveryId,
        riderId
    ];

    const updateQuery = `
        WITH accepted AS (
            UPDATE deliveries
            SET
                rider_id = $3,
                status = 'accepted',
                accepted_at = CURRENT_TIMESTAMP
            WHERE deliveries.id = $2
                AND deliveries.rider_id IS NULL
                AND deliveries.status = 'searching_rider'
                AND EXISTS (
                    SELECT 1
                    FROM delivery_offers AS d_offers
                    WHERE d_offers.id = $1
                        AND d_offers.delivery_id = $2
                        AND d_offers.rider_id = $3
                        AND d_offers.status = 'offered'
                        AND d_offers.expires_at > CURRENT_TIMESTAMP
                )
                RETURNING
                    deliveries.*,
                    deliveries.id AS delivery_id
        ),

        updated_offers AS (
            UPDATE delivery_offers
            SET
                status = CASE
                    WHEN delivery_offers.id = $1 
                        THEN 'accepted'
                    ELSE 'cancelled'
                END,
                responded_at = CASE
                    WHEN delivery_offers.id = $1
                        THEN CURRENT_TIMESTAMP
                    ELSE delivery_offers.responded_at
                END

            FROM accepted a

            WHERE delivery_offers.delivery_id = a.delivery_id
                AND delivery_offers.expires_at > CURRENT_TIMESTAMP
                AND (
                    delivery_offers.id = $1
                    OR delivery_offers.status = 'offered'
                )
                
            RETURNING
                delivery_offers.id AS offer_id,
                delivery_offers.rider_id,
                delivery_offers.status
        )

        SELECT *
        FROM accepted
    `;

    const {rows} = await pool.query(
        updateQuery,
        params
    );

    return rows[0];
};

const rejectDeliveryOfferRepo = async ({
    offerId,
    riderId
}) => {
    
    const updateQuery = `
        UPDATE delivery_offers
        SET
            status = 'rejected',
            responded_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND rider_id = $2
          AND status = 'offered'
        RETURNING
            id;
    `;

    const { rows } = await pool.query(
        updateQuery,
        [offerId, riderId]
    );
    
    return rows[0];
};

const getActiveDeliveryByRiderRepo = async ({
    riderId
}) => {

    const searchQuery = `
        SELECT
            d.id AS delivery_id,

            d.order_id,
            d.restaurant_order_id,
            d.user_id,
            
            d.restaurant_id,
            d.restaurant_name,
            d.restaurant_address,
            
            d.recipient_name,
            d.recipient_phone,
            d.delivery_address,
            
            ST_X(d.pickup_location::geometry) AS pickup_longitude,
            ST_Y(d.pickup_location::geometry) AS pickup_latitude,
            
            ST_X(d.drop_location::geometry) AS drop_longitude,
            ST_Y(d.drop_location::geometry) AS drop_latitude,
            
            d.aerial_distance_meters,
            d.estimated_distance_meters,
            d.estimated_duration_seconds,
            
            d.status,
            d.assigned_at,
            d.accepted_at,
            d.picked_up_at,
            d.delivered_at
        
        FROM deliveries d
        WHERE d.rider_id = $1
          AND d.status 
            IN (
                'assigned',
                'accepted',
                'picked_up',
                'on_the_way'
            )
        LIMIT 1;
    `;

    const { rows } = await pool.query(
        searchQuery,
        [riderId]
    );
    
    return rows[0];
};

const updateDeliveryStatusRepo = async ({
    deliveryId,
    riderId,
    status
}) => {

    const params = [
        status,
        deliveryId,
        riderId
    ];
    
    let timestampField = '';
    
    if(status === 'accepted') timestampField = ', accepted_at = CURRENT_TIMESTAMP';
    if(status === 'picked_up') timestampField = ', picked_up_at = CURRENT_TIMESTAMP';
    if(status === 'delivered') timestampField = ', delivered_at = CURRENT_TIMESTAMP';
    if(status === 'cancelled') timestampField = ', cancelled_at = CURRENT_TIMESTAMP';

    const updateQuery = `
        UPDATE deliveries
        SET
            status = $1
            ${timestampField}
        WHERE id = $2
          AND rider_id = $3
        RETURNING
            id AS delivery_id,
            order_id,
            restaurant_order_id,
            user_id,
            rider_id,
            status,
            picked_up_at,
            delivered_at;
    `;

    const { rows } = await pool.query(
        updateQuery,
        params
    );
    
    return rows[0];
};


export {
    acceptDeliveryOfferRepo,
    rejectDeliveryOfferRepo,
    getActiveDeliveryByRiderRepo,
    updateDeliveryStatusRepo
};