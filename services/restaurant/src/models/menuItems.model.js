import pool from "../config/postgre.js";

import createUpdatedAtTrigger 
from "../utils/dbTriggers.util.js";


const createMenuItemsTable = async()=>{
    try{
        await pool.query(`
            CREATE TABLE IF NOT EXISTS menu_items(
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),
                
                restaurant_id UUID NOT NULL
                    REFERENCES restaurant(id) ON DELETE CASCADE,
                
                name VARCHAR(250) NOT NULL,

                category VARCHAR(100) NOT NULL,
                
                description TEXT NOT NULL,
                
                pictures_urls TEXT[] DEFAULT '{}',

                // price in paise
                price INTEGER NOT NULL CHECK (price >= 0),

                is_available BOOLEAN DEFAULT FALSE,

                deleted_at TIMESTAMPTZ,
                deactivated_at TIMESTAMPTZ,

                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);


        await pool.query(
            ` CREATE INDEX IF NOT EXISTS idx_restaurants_id
                ON menu_items(restaurant_id)`
        );

        await createUpdatedAtTrigger("menu_items");

        console.log("✅ Menu Items table created successfully.");
    }catch(err){

        console.error("❌ Menu Items table creation failed");
        console.error(err);
    }
};


export default createMenuItemsTable;