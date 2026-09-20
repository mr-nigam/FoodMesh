import pool from "../config/postgre.js";

import {
    createUpdatedAtTrigger
} from "@foodmesh/utils";


const createDeliveryOffersTable = async () => {
    try{
        await pool.query(`
            CREATE TABLE IF NOT EXISTS delivery_offers(
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                delivery_id UUID NOT NULL,

                rider_id UUID NOT NULL,

                status VARCHAR(20) NOT NULL
                    DEFAULT 'offered'
                    CHECK (
                        status IN (
                            'offered',
                            'accepted',
                            'rejected',
                            'expired',
                            'cancelled'
                        )
                    ),

                offered_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                expires_at TIMESTAMPTZ
                    NOT NULL,

                responded_at TIMESTAMPTZ,

                created_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT uq_delivery_offer_rider
                    UNIQUE(
                        delivery_id,
                        rider_id
                    )
            );
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_delivery_offers_delivery_id
                ON delivery_offers(delivery_id);

            CREATE INDEX IF NOT EXISTS idx_delivery_offers_rider_id
                ON delivery_offers(rider_id);

            CREATE INDEX IF NOT EXISTS idx_delivery_offers_status
                ON delivery_offers(status);

            CREATE INDEX IF NOT EXISTS idx_delivery_offers_delivery_status
                ON delivery_offers(delivery_id, status);

            CREATE INDEX IF NOT EXISTS idx_delivery_offers_rider_status
                ON delivery_offers(rider_id, status);

            CREATE INDEX IF NOT EXISTS idx_delivery_offers_expiry
                ON delivery_offers(expires_at)
                WHERE status = 'offered';
        `);

        await createUpdatedAtTrigger(
            pool,
            "delivery_offers"
        );

        console.log(
            "✅ Delivery Offers table created successfully."
        );

    }catch(error){
        console.error(
            "❌ Delivery Offers table creation failed",
            error
        );

        throw error;
    }
};


export default createDeliveryOffersTable;