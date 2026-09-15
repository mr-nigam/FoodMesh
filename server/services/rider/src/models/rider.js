import pool from '../config/postgre.js';

import {
    createUpdatedAtTrigger
} from '@foodmesh/utils';


const createRiderTable = async()=>{
    try{
        
        await pool.query(`
             CREATE EXTENSION IF NOT EXISTS postgis;
            CREATE EXTENSION IF NOT EXISTS citext;
            CREATE EXTENSION IF NOT EXISTS pgcrypto;    
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS riders(
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),
                
                user_id UUID UNIQUE NOT NULL,

                name VARCHAR(50) NOT NULL,

                email CITEXT UNIQUE NOT NULL
                    CHECK (
                        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
                    ),

                phone VARCHAR(15) UNIQUE
                    CHECK (
                        phone ~ '^\\+[1-9][0-9]{6,14}$'
                    ),

                profile_picture_url TEXT,
                
                gender VARCHAR(20) DEFAULT 'not_shared'
                    CHECK (gender IN (
                        'male',
                        'female',
                        'other',
                        'not_shared'
                    )),

                date_of_birth DATE
                CHECK (
                    date_of_birth <= CURRENT_DATE
                    AND date_of_birth >= CURRENT_DATE - INTERVAL '120 years'
                ),

                status VARCHAR(30) NOT NULL
                    DEFAULT 'pending'
                    CHECK (
                        status IN (
                            'pending',
                            'active',
                            'suspended',
                            'deactivated',
                            'blocked'
                        )
                    ),

                availability_status VARCHAR(20) NOT NULL
                    DEFAULT 'offline'
                    CHECK (
                        availability_status IN (
                            'offline',
                            'online',
                            'busy'
                        )
                    ),

                location GEOGRAPHY(POINT, 4326) NOT NULL,

                location_updated_at TIMESTAMPTZ,

                last_seen_at TIMESTAMPTZ,

                deleted_at TIMESTAMPTZ,
                deactivated_at TIMESTAMPTZ,
                
                is_verified BOOLEAN NOT NULL
                    DEFAULT FALSE,

                verified_at TIMESTAMPTZ,

                created_at TIMESTAMPTZ 
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ 
                    DEFAULT CURRENT_TIMESTAMP;
            );    
        `);
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_rider_location
                ON rider
                USING GIST(location);

            CREATE INDEX IF NOT EXISTS idx_riders_availability
                ON riders(availability_status)
                WHERE deleted_at IS NULL;

            CREATE INDEX IF NOT EXISTS idx_riders_status
                ON riders(status)
                WHERE deleted_at IS NULL;
        `);

        await createUpdatedAtTrigger(pool, 'riders');

        console.log("✅ Rider table created successfully.");

    }catch(error){
        console.error("❌ Rider table creation failed", error);
    }
};


export default createRiderTable;