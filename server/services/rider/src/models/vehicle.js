import pool from '../config/postgre.js';

import {
    createUpdatedAtTrigger
} from '@foodmesh/utils';


const createVehicleTable = async()=>{
    try{
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vehicles(
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),
                
                rider_id UUID NOT NULL
                    REFERENCES riders(id)
                    ON DELETE CASCADE,

                vehicle_type VARCHAR(30) NOT NULL
                    CHECK (
                        vehicle_type IN (
                            'bicycle',
                            'motorcycle',
                            'scooter',
                            'car',
                            'other'
                        )
                    ),

                manufacturer VARCHAR(100),

                model VARCHAR(100),

                color VARCHAR(50),

                registration_number VARCHAR(30) UNIQUE,

                registration_expiry_date DATE,

                is_primary BOOLEAN NOT NULL
                    DEFAULT FALSE,

                verification_status VARCHAR(20) NOT NULL
                    DEFAULT 'pending'
                    CHECK (
                        verification_status IN (
                            'pending',
                            'verified',
                            'rejected',
                            'expired'
                        )
                    ),

                verified_at TIMESTAMPTZ,

                deleted_at TIMESTAMPTZ,
                
                created_at TIMESTAMPTZ 
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ 
                    DEFAULT CURRENT_TIMESTAMP
            );    
        `);
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_vehicles_rider_id
                ON vehicles(rider_id)
                WHERE deleted_at IS NULL;
                
            CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_vehicle_per_rider
                ON vehicles(rider_id)
                WHERE is_primary = TRUE
                  AND deleted_at IS NULL;
        `);

        await createUpdatedAtTrigger(pool, 'vehicles');

        console.log("✅ Vehicles table created successfully.");

    }catch(error){
        console.error("❌ Vehicles table creation failed", error);
    }
};


export default createVehicleTable;