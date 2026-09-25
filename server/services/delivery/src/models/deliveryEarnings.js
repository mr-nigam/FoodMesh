import pool from "../config/postgre.js";

import {
    createUpdatedAtTrigger
} from "@foodmesh/utils";


const createDeliveryEarningsTable = async () => {
    try{
        await pool.query(`
            CREATE TABLE IF NOT EXISTS delivery_earnings (
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                delivery_id UUID NOT NULL
                    UNIQUE
                    REFERENCES deliveries(id)
                    ON DELETE CASCADE,

                customer_delivery_fee NUMERIC(12,2)
                    NOT NULL
                    DEFAULT 0
                    CHECK (
                        customer_delivery_fee >= 0
                    ),

                rider_base_earning NUMERIC(12,2)
                    NOT NULL
                    DEFAULT 0
                    CHECK (
                        rider_base_earning >= 0
                    ),

                rider_distance_earning NUMERIC(12,2)
                    NOT NULL
                    DEFAULT 0
                    CHECK (
                        rider_distance_earning >= 0
                    ),

                rider_bonus NUMERIC(12,2)
                    NOT NULL
                    DEFAULT 0
                    CHECK (
                        rider_bonus >= 0
                    ),

                rider_tip NUMERIC(12,2)
                    NOT NULL
                    DEFAULT 0
                    CHECK (
                        rider_tip >= 0
                    ),

                /*
                 * Calculated rider earning.
                 *
                 * We keep this persisted because the amount should
                 * remain historically stable after the delivery.
                 */

                rider_total_earning NUMERIC(12,2)
                    NOT NULL
                    DEFAULT 0
                    CHECK (
                        rider_total_earning >= 0
                    ),

                /*
                 * Settlement state.
                 */

                settlement_status VARCHAR(20)
                    NOT NULL
                    DEFAULT 'pending'
                    CHECK (
                        settlement_status IN (
                            'pending',
                            'processing',
                            'paid',
                            'failed'
                        )
                    ),

                settled_at TIMESTAMPTZ,

                created_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_delivery_earnings_delivery_id
                ON delivery_earnings(delivery_id);

            CREATE INDEX IF NOT EXISTS idx_delivery_earnings_settlement_status
                ON delivery_earnings(settlement_status);
        `);

        await createUpdatedAtTrigger(
            pool,
            "delivery_earnings"
        );

        console.log(
            "✅ Delivery Earnings table created successfully."
        );

    }catch(error){
        console.error(
            "❌ Delivery Earnings table creation failed",
            error
        );

        throw error;
    }
};


export default createDeliveryEarningsTable;