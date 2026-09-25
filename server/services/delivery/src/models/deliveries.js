import pool from "../config/postgre.js";

import {
    createUpdatedAtTrigger
} from "@foodmesh/utils";


const createDeliveriesTable = async () => {
    try{
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS postgis;
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS deliveries(
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                order_id UUID NOT NULL,

                restaurant_order_id UUID NOT NULL UNIQUE,

                user_id UUID NOT NULL,

                restaurant_id UUID NOT NULL,

                rider_id UUID,

                restaurant_name VARCHAR(255) NOT NULL,
                restaurant_address JSONB NOT NULL,

                recipient_name VARCHAR(255) NOT NULL,
                recipient_phone VARCHAR(15) NOT NULL
                    CHECK (
                        recipient_phone ~ '^\\+[1-9][0-9]{6,14}$'
                    ),

                delivery_address JSONB NOT NULL,

                pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,

                drop_location GEOGRAPHY(POINT, 4326) NOT NULL,

                aerial_distance_meters INTEGER
                    CHECK (
                        aerial_distance_meters >= 0
                    ),
                
                estimated_distance_meters INTEGER
                    CHECK (
                        estimated_distance_meters >= 0
                    ),
                
                actual_distance_meters INTEGER
                    CHECK (
                        actual_distance_meters >= 0
                    ),

                estimated_duration_seconds INTEGER
                    CHECK (
                        estimated_duration_seconds >= 0
                    ),

                actual_duration_seconds INTEGER
                    CHECK (
                        actual_duration_seconds >= 0
                    ),

                status VARCHAR(30) NOT NULL
                    DEFAULT 'pending'
                    CHECK (
                        status IN (
                            'pending',
                            'searching_rider',
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

                failed_at TIMESTAMPTZ,

                created_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_deliveries_order_id
                ON deliveries(order_id);

            CREATE INDEX IF NOT EXISTS idx_deliveries_restaurant_order_id
                ON deliveries(restaurant_order_id);

            CREATE INDEX IF NOT EXISTS idx_deliveries_user_id
                ON deliveries(user_id);

            CREATE INDEX IF NOT EXISTS idx_deliveries_restaurant_id
                ON deliveries(restaurant_id);

            CREATE INDEX IF NOT EXISTS idx_deliveries_rider_id
                ON deliveries(rider_id);

            CREATE INDEX IF NOT EXISTS idx_deliveries_status
                ON deliveries(status);

            CREATE INDEX IF NOT EXISTS idx_deliveries_pickup_location
                ON deliveries
                USING GIST(pickup_location);

            CREATE INDEX IF NOT EXISTS idx_deliveries_drop_location
                ON deliveries
                USING GIST(drop_location);
        `);

        await createUpdatedAtTrigger(
            pool,
            "deliveries"
        );

        console.log(
            "✅ Deliveries table created successfully."
        );

    }catch(error){
        console.error(
            "❌ Deliveries table creation failed",
            error
        );

        throw error;
    }
};


export default createDeliveriesTable;