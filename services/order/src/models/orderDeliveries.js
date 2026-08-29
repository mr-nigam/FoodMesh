import pool from "../config/postgre.js";

import createUpdatedAtTrigger
from "../utils/dbTrigger.js";


const createOrderDeliveriesTable = async () => {
    try {

        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS postgis;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_deliveries (
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                -- Logical reference to Order Service.
                order_id UUID NOT NULL UNIQUE,

                -- Logical reference to Rider/Delivery Service.
                rider_id UUID,

                -- Customer snapshot
                customer_name VARCHAR(255) NOT NULL,

                customer_phone VARCHAR(15) NOT NULL
                    CHECK (
                        customer_phone ~ '^\\+[1-9][0-9]{6,14}$'
                    ),

                delivery_address JSONB NOT NULL,

                -- Restaurant snapshot
                restaurant_id UUID NOT NULL,

                restaurant_name VARCHAR(255) NOT NULL,

                restaurant_address JSONB NOT NULL,

                -- Delivery locations
                pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,

                drop_location GEOGRAPHY(POINT, 4326) NOT NULL,

                -- Distance in meters
                estimated_distance_meters INTEGER
                    CHECK (estimated_distance_meters >= 0),

                actual_distance_meters INTEGER
                    CHECK (actual_distance_meters >= 0),

                -- Duration in seconds
                estimated_duration_seconds INTEGER
                    CHECK (estimated_duration_seconds >= 0),

                actual_duration_seconds INTEGER
                    CHECK (actual_duration_seconds >= 0),

                -- Delivery lifecycle
                status VARCHAR(30) NOT NULL
                    DEFAULT 'pending'
                    CHECK (
                        status IN (
                            'pending',
                            'assigned',
                            'accepted',
                            'picked_up',
                            'on_the_way',
                            'delivered',
                            'cancelled',
                            'failed'
                        )
                    ),

                assigned_at TIMESTAMPTZ,

                accepted_at TIMESTAMPTZ,

                picked_up_at TIMESTAMPTZ,

                delivered_at TIMESTAMPTZ,

                cancelled_at TIMESTAMPTZ,

                -- Customer delivery charge
                customer_delivery_fee NUMERIC(12,2)
                    NOT NULL
                    DEFAULT 0
                    CHECK (customer_delivery_fee >= 0),

                -- Rider earnings
                rider_base_earning NUMERIC(12,2)
                    NOT NULL
                    DEFAULT 0
                    CHECK (rider_base_earning >= 0),

                rider_distance_earning NUMERIC(12,2)
                    NOT NULL
                    DEFAULT 0
                    CHECK (rider_distance_earning >= 0),

                rider_bonus NUMERIC(12,2)
                    NOT NULL
                    DEFAULT 0
                    CHECK (rider_bonus >= 0),

                rider_tip NUMERIC(12,2)
                    NOT NULL
                    DEFAULT 0
                    CHECK (rider_tip >= 0),

                rider_total_earning NUMERIC(12,2)
                    NOT NULL
                    DEFAULT 0
                    CHECK (rider_total_earning >= 0),

                created_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_order_deliveries_rider_id
                ON order_deliveries(rider_id);

            CREATE INDEX IF NOT EXISTS idx_order_deliveries_restaurant_id
                ON order_deliveries(restaurant_id);

            CREATE INDEX IF NOT EXISTS idx_order_deliveries_status
                ON order_deliveries(status);

            CREATE INDEX IF NOT EXISTS idx_order_deliveries_pickup_location
                ON order_deliveries
                USING GIST(pickup_location);

            CREATE INDEX IF NOT EXISTS idx_order_deliveries_drop_location
                ON order_deliveries
                USING GIST(drop_location);
        `);

        await createUpdatedAtTrigger("order_deliveries");

        console.log(
            "✅ Order Deliveries table created successfully."
        );

    }catch(error){

        console.error(
            "❌ Order Deliveries table creation failed",
            error
        );

        throw error;
    }
};


export default createOrderDeliveriesTable;