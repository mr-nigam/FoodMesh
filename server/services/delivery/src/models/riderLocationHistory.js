import pool from "../config/postgre.js";

const createRiderLocationHistoryTable = async () => {
    try {
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto;

            CREATE TABLE IF NOT EXISTS rider_location_history(
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                event_id UUID UNIQUE NOT NULL,
                rider_id UUID NOT NULL,
                order_id UUID NOT NULL,
                latitude DOUBLE PRECISION NOT NULL,
                longitude DOUBLE PRECISION NOT NULL,
                accuracy REAL,
                speed REAL,
                heading REAL,
                sequence INTEGER,
                recorded_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_rider_loc_hist_rider_rec 
                ON rider_location_history(rider_id, recorded_at DESC);

            CREATE INDEX IF NOT EXISTS idx_rider_loc_hist_order_rec 
                ON rider_location_history(order_id, recorded_at DESC);

            CREATE UNIQUE INDEX IF NOT EXISTS idx_rider_loc_hist_event_id 
                ON rider_location_history(event_id);
        `);

        console.log("✅ rider_location_history table verified/created successfully.");
    } catch (err) {
        console.error("❌ Failed to create rider_location_history table:", err.message);
        throw err;
    }
};

export default createRiderLocationHistoryTable;
