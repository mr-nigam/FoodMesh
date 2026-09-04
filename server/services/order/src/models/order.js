import pool from "../config/postgre.js";

import createUpdatedAtTrigger
from "../utils/dbTrigger.js";


const createOrdersTable = async () => {
    try {

        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                -- Reference to user-service user.
                user_id UUID NOT NULL,

                recipient_name VARCHAR(100) 
                    DEFAULT 'account_holder',

                recipient_phone VARCHAR(15)
                    CHECK (
                        user_phone ~ '^\\+[1-9][0-9]{6,14}$'
                    ),

                delivery_address JSONB NOT NULL,

                status VARCHAR(30) NOT NULL
                    DEFAULT 'placed'
                    CHECK (
                        status IN (
                            'placed',
                            'confirmed',
                            'accepted_at_restaurant',
                            'preparing',
                            'ready_for_rider',
                            'rider_assigned',
                            'picked_up',
                            'on_the_way',
                            'delivered',
                            'cancelled'
                        )
                    ),

                subtotal NUMERIC(12,2) NOT NULL
                    CHECK (subtotal >= 0),

                delivery_fee NUMERIC(12,2) NOT NULL
                    DEFAULT 0
                    CHECK (delivery_fee >= 0),

                tax_amount NUMERIC(12,2) NOT NULL
                    DEFAULT 0
                    CHECK (tax_amount >= 0),

                discount_amount NUMERIC(12,2) NOT NULL
                    DEFAULT 0
                    CHECK (discount_amount >= 0),

                total_amount NUMERIC(12,2) NOT NULL
                    CHECK (total_amount >= 0),

                expire_at TIMESTAMPTZ,

                deleted_at TIMESTAMPTZ,

                created_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_orders_user_id
            ON orders(user_id);

            CREATE INDEX IF NOT EXISTS idx_orders_status
            ON orders(status);

            CREATE INDEX IF NOT EXISTS idx_orders_created_at
            ON orders(created_at DESC);
        `);

        await createUpdatedAtTrigger("orders");

        console.log("✅ Orders table created successfully.");

    }catch(error){

        console.error(
            "❌ Orders table creation failed",
            error
        );

        throw error;
    }
};


export default createOrdersTable;