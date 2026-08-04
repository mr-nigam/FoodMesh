import pool from 
'../config/postgre.js';

import createUpdatedAtTrigger from 
'../utils/dbTriggers.util.js';


const createRestaurantstable = async () => {
    try{
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS citext;
            CREATE EXTENSION IF NOT EXISTS pgcrypto; 
        `);
        
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'restaurant_type_enum') THEN
                    CREATE TYPE restaurant_type_enum AS ENUM ('veg', 'non_veg', 'both');
                END IF;
            END $$;
        `);

        await pool.query(`
            CREATE restaurants TABLE IF NOT EXISTS(
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                owner_id UUID NOT NULL 
                    REFERENCES users(id) ON DELETE CASCADE,
                
                name VARCHAR(100) NOT NULL,

                desciption TEXT,

                email CITEXT UNIQUE NOT NULL
                    CHECK (
                        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
                    ),

                -- E.164 Format
                phone VARCHAR(15) UNIQUE
                    CHECK (
                        phone ~ '^\\+[1-9][0-9]{6,14}$'
                    ),

                pictures_urls TEXT[] DEFAULT '{}',

                 -- Geolocation & Address
                latitude NUMERIC(10, 8) CHECK (latitude BETWEEN -90 AND 90),
                longitude NUMERIC(11, 8) CHECK (longitude BETWEEN -180 AND 180),
                address TEXT NOT NULL,
            
                isVerified BOOLEAN DEFAULT false,
                isOpen BOOLEAN DEFAULT false,

                 -- Operating Hours
                opening_time TIME NOT NULL DEFAULT '09:00:00',
                closing_time TIME NOT NULL DEFAULT '22:00:00',

                -- Dietary classification ENUM
                type restaurant_type_enum NOT NULL DEFAULT 'both',

                deleted_at TIMESTAMPTZ,
                deactivated_at TIMESTAMPTZ,

                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
       await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_restaurants_name
                ON restaurants(name);

            CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id
                ON restaurants(owner_id);

            CREATE INDEX IF NOT EXISTS idx_restaurants_type
                ON restaurants(type);

            CREATE INDEX IF NOT EXISTS idx_restaurants_is_open
                ON restaurants(is_open) 
                WHERE deleted_at IS NULL;
        `);

        await createUpdatedAtTrigger('restaurants');
        
        console.log("Restaurant table, ENUMs and indexes created successfully");

    }catch(err){
        
        console.error("Restaurant Table creation failed", err);
    }
};


export default createRestaurantstable;