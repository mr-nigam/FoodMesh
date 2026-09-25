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
            WHERE id = $2
                AND rider_id IS NULL
                AND status = 'searching_rider'
                AND EXISTS (
                    SELECT 1
                    FROM delivery_offers
                    WHERE id = $1
                        AND delivery_id = $2
                        AND rider_id = $3
                        AND status = 'offered'
                        AND expires_at > CURRENT_TIMESTAMP
                )
                RETURNING id
        ),

        updated_offers AS (
            UPDATE delivery_offers
            SET
                status = CASE
                    WHEN id = $1 THEN 'accepted'
                    ELSE 'cancelled'
                END,
                responded_at = CASE
                    WHEN id = $1 THEN CURRENT_TIMESTAMP
                    ELSE responded_at
                END
            FROM accepted a
            WHERE delivery_offers.delivery_id = a.id
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
}

const acceptDeliveryOfferRepo2 = async({
    offerId,
    riderId    
})=>{

    const client = await pool.connect();
    
    try{
        await client.query('BEGIN');

        // 1. Fetch offer and lock row
        const offerQuery = `
            SELECT * FROM delivery_offers
            WHERE id = $1 AND rider_id = $2
            FOR UPDATE;
        `;

        const { rows: offerRows } = await client.query(
            offerQuery,
            [offerId, riderId]
        );
        
        if(offerRows.length === 0){
            await client.query('ROLLBACK');
            return { error: 'Offer not found or does not belong to you' };
        }

        const offer = offerRows[0];

        if(offer.status !== 'offered'){
            await client.query('ROLLBACK');
            return { error: `Offer is already ${offer.status}` };
        }

        if(new Date() > new Date(offer.expires_at)){
            await client.query(
                `UPDATE delivery_offers SET status = 'expired' WHERE id = $1`,
                [offerId]
            );
            
            await client.query('COMMIT');
            return { error: 'Offer has expired' };
        }

         // 2. Fetch and lock delivery row
        const deliveryQuery = `
            SELECT * FROM deliveries
            WHERE id = $1
            FOR UPDATE;
        `;

        const { rows: deliveryRows } = await client.query(
            deliveryQuery,
            [offer.delivery_id]
        );
        
        if(deliveryRows.length === 0){
            await client.query('ROLLBACK');
            return { error: 'Delivery not found' };
        }

        const delivery = deliveryRows[0];
        if(
            delivery.rider_id || 
            !['pending', 'searching_rider'].includes(delivery.status)
        ){
            await client.query('ROLLBACK');
            return { error: 'Delivery has already been assigned to another rider' };
        }

        // 3. Mark offer accepted
        const updateOfferQuery = `
            UPDATE delivery_offers
            SET
                status = 'accepted',
                responded_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;
        const { rows: updatedOfferRows } = await client.query(
            updateOfferQuery,
            [offerId]
        );
        
        // 4. Update delivery row
        const updateDeliveryQuery = `
            UPDATE deliveries
            SET
                rider_id = $1,
                status = 'assigned',
                assigned_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
        `;
        const { rows: updatedDeliveryRows } = await client.query(updateDeliveryQuery, [
            riderId,
            offer.delivery_id
        ]);

        // 5. Cancel all other active offers for this delivery
        await client.query(
            `UPDATE delivery_offers
             SET status = 'cancelled'
             WHERE delivery_id = $1 AND id != $2 AND status = 'offered'`,
            [offer.delivery_id, offerId]
        );
        await client.query('COMMIT');
        return {
            success: true,
            offer: updatedOfferRows[0],
            delivery: updatedDeliveryRows[0]
        };
        

    }catch(error){
        await client.query('ROLLBACK');
        throw err;
    }finally{
        client.release();
    }
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