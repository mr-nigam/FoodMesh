import pool from "../config/postgre.js";

import createUpdatedAtTrigger 
from "../utils/dbTriggers.js";


const createAddressTable = async() => {
    try{
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS postgis CASCADE;
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS addresses(
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                user_id UUID NOT NULL
                    REFERENCES users(id)
                    ON DELETE CASCADE,

                label VARCHAR(50) NOT NULL
                    CHECK (length(trim(label)) > 0)
                    DEFAULT 'Home',

                recipient_name VARCHAR(100) NOT NULL
                    CHECK (length(trim(recipient_name)) > 0),

                recipient_phone VARCHAR(15)
                    CHECK (
                        phone ~ '^\+[1-9][0-9]{6,14}$'
                    ),

                address_line_1 VARCHAR(255) NOT NULL,

                address_line_2 VARCHAR(255),

                landmark VARCHAR(255),

                city VARCHAR(100) NOT NULL,

                state VARCHAR(100) NOT NULL,

                postal_code VARCHAR(20) NOT NULL,

                country_code CHAR(2) NOT NULL
                    DEFAULT 'IN'
                    CHECK (country_code ~ '^[A-Z]{2}$'),

                location GEOGRAPHY(POINT, 4326) NOT NULL,

                formatted_address TEXT,

                is_default BOOLEAN NOT NULL
                    DEFAULT FALSE,
                
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
            CREATE INDEX IF NOT EXISTS idx_addresses_user_id
                ON addresses(user_id);

            CREATE INDEX IF NOT EXISTS idx_addresses_location
                ON addresses
                USING GIST(location);

            CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_default_user
                ON addresses(user_id)
                WHERE is_default = TRUE 
                    AND deleted_at IS NULL;
        `);

        await createUpdatedAtTrigger("addresses");

        console.log("✅ Address table created successfully.");

    }catch(error){

        console.error("❌ Address table creation failed", error);
    }
};


export default createAddressTable;