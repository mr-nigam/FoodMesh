import pool from '../config/postgre.js';

import createUpdatedAtTrigger
from '../utils/dbTrigger.js';


const createPaymentsTable = async () => {
    try{

        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                -- Reference to user-service.
                user_id UUID NOT NULL,

                -- Reference to order-service.
                order_id UUID NOT NULL UNIQUE,

                status VARCHAR(30)
                    NOT NULL
                    DEFAULT 'pending'
                    CHECK (
                        status IN (
                            'pending',
                            'processing',
                            'success',
                            'failed',
                            'cancelled',
                            'refunded'
                        )
                    ),

                amount NUMERIC(12,2) NOT NULL
                    CHECK (amount >= 0),

                currency VARCHAR(3)
                    NOT NULL
                    DEFAULT 'INR'
                    CHECK (
                        currency = UPPER(currency)
                    ),

                created_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS
            idx_payments_user_id
            ON payments(user_id);

            CREATE INDEX IF NOT EXISTS
            idx_payments_status
            ON payments(status);

            CREATE INDEX IF NOT EXISTS
            idx_payments_created_at
            ON payments(created_at);
        `);

        await createUpdatedAtTrigger("payments");

        console.log("✅ Payments table created successfully.");

    }catch(error){

        console.error(
            "❌ Payments table creation failed",
            error
        );

        throw error;
    }
};


export default createPaymentsTable;