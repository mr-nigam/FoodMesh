import pool from 
'../config/postgre.js';

import createUpdatedAtTrigger 
from '../utils/dbTriggers.util.js';


const createUsersTable = async() => {
    try{
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS citext;
        `);
        
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto;    
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                name VARCHAR(50) NOT NULL,

                email CITEXT UNIQUE NOT NULL
                    CHECK (
                        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
                    ),

                -- E.164 Format
                phone VARCHAR(15) UNIQUE
                    CHECK (
                        phone ~ '^\\+[1-9][0-9]{6,14}$'
                    ),
                
                role VARCHAR(15) 
                    CHECK(
                        role IN(
                            'user',
                            'restaurant',
                            'rider',
                            'admin'
                            )
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

                password TEXT,
                password_changed_at TIMESTAMPTZ,
                refresh_token TEXT,

                deleted_at TIMESTAMPTZ,
                deactivated_at TIMESTAMPTZ,
                
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );    
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_users_role
            ON users(role)
        `);
        
        await createUpdatedAtTrigger('users');
        
        console.log("User table and indexes created successfully");

    }catch(err){

        console.error(" Used Table creation failed", err);
    
    }
};


export default createUsersTable;