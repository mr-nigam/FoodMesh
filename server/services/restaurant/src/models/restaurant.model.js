import pool from "../config/postgre.js";

import createUpdatedAtTrigger 
from "../utils/dbTriggers.util.js";


const createRestaurantTable = async () => {
    try {
        // Required Extensions
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS citext CASCADE;
            CREATE EXTENSION IF NOT EXISTS pgcrypto CASCADE;
            CREATE EXTENSION IF NOT EXISTS postgis CASCADE;
        `);

        // Restaurant Type ENUM
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname = 'restaurant_type_enum'
                ) THEN
                    CREATE TYPE restaurant_type_enum AS ENUM
                    ('veg', 'non_veg', 'both');
                END IF;
            END $$;
        `);

        // Restaurant Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS restaurants (
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                owner_id UUID NOT NULL
                    REFERENCES users(id) ON DELETE CASCADE,

                name VARCHAR(100) NOT NULL,

                description TEXT,
                
                email CITEXT UNIQUE NOT NULL
                    CHECK (
                        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
                    ),

                phone VARCHAR(15) UNIQUE
                    CHECK (
                        phone ~ '^\\+[1-9][0-9]{6,14}$'
                    ),

                pictures_urls TEXT[] DEFAULT '{}',

                location GEOGRAPHY(POINT, 4326) NOT NULL,

                address TEXT NOT NULL,

                is_verified BOOLEAN DEFAULT FALSE,

                is_open BOOLEAN DEFAULT FALSE,

                opening_time TIME NOT NULL DEFAULT '09:00:00',

                closing_time TIME NOT NULL DEFAULT '22:00:00',

                type restaurant_type_enum NOT NULL DEFAULT 'both',

                deleted_at TIMESTAMPTZ,

                deactivated_at TIMESTAMPTZ,

                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_restaurants_name
                ON restaurants(name);

            CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id
                ON restaurants(owner_id);

            CREATE INDEX IF NOT EXISTS idx_restaurants_type
                ON restaurants(type);

            --CREATE INDEX IF NOT EXISTS idx_restaurants_is_open
              --ON restaurants(is_open)
                --WHERE deleted_at IS NULL;
        `);

        // Trigger
        await createUpdatedAtTrigger("restaurants");

        console.log("✅ Restaurants table created successfully.");
    
    }catch(err){
        
        console.error("❌ Restaurant table creation failed");
        console.error(err);
    }
};

export default createRestaurantTable;