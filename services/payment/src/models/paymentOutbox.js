import pool from '../config/postgre.js';

import createUpdatedAtTrigger
from '../utils/dbTrigger.js';


const createPaymentOutboxTable = async () => {

    try{
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS payment_outbox (
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                payment_id UUID NOT NULL
                    REFERENCES payments(id)
                    ON DELETE CASCADE,

                event_type VARCHAR(100)
                    NOT NULL,

                payload JSONB NOT NULL,

                status VARCHAR(30)
                    NOT NULL
                    DEFAULT 'pending'
                    CHECK (
                        status IN (
                            'pending',
                            'processing',
                            'published',
                            'failed'
                        )
                    ),

                attempts INTEGER
                    NOT NULL
                    DEFAULT 0
                    CHECK (attempts >= 0),

                next_attempt_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                published_at TIMESTAMPTZ,

                last_error TEXT,

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
            idx_payment_outbox_pending
            ON payment_outbox(next_attempt_at)
            WHERE status IN ('pending', 'failed');

            CREATE INDEX IF NOT EXISTS
            idx_payment_outbox_payment_id
            ON payment_outbox(payment_id);

            CREATE INDEX IF NOT EXISTS
            idx_payment_outbox_event_type
            ON payment_outbox(event_type);
        `);

        await createUpdatedAtTrigger("payment_outbox");

        console.log("✅ Payment Outbox table created successfully.");

    }catch(error){

        console.error(
            "❌ Payment Outbox table creation failed",
            error
        );

        throw error;
    }
};


export default createPaymentOutboxTable;