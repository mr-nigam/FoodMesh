import pool from "../config/postgre.js";

import createUpdatedAtTrigger 
from "../utils/dbTriggers.util.js";


const createCartTable = async()=>{
    try{
        await pool.query(`
            CREATE TABLE IF NOT EXISTS carts(
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),
                
                user_id UUID NOT NULL
                    REFERENCES users(id) 
                    ON DELETE CASCADE,
                
                restaurant_id UUID NOT NULL
                    REFERENCES restaurants(id) 
                    ON DELETE CASCADE,

                item_id UUID NOT NULL
                    REFERENCES menu_items(id) 
                    ON DELETE CASCADE,
                
                quantity INTEGER DEFAULT 0
                    CHECK (quantity >= 0),            

                price INTEGER NOT NULL 
                    CHECK (price >= 0),

                created_at TIMESTAMPTZ 
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ 
                    DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT uq_carts_user_restaurant_item
                    UNIQUE(user_id, restaurant_id, item_id)
            );
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_carts_user_id
                ON carts(user_id);

            CREATE INDEX IF NOT EXISTS idx_carts_restaurant_id
                ON carts(restaurant_id);

            CREATE INDEX IF NOT EXISTS idx_carts_item_id
                ON carts(item_id);

            CREATE INDEX IF NOT EXISTS idx_carts_user_restaurant
                ON carts(user_id, restaurant_id);
        `);

        await createUpdatedAtTrigger("carts");

        console.log("✅ Carts table created successfully.");
        
    }catch(err){

        console.error("❌ Carts table creation failed");
        console.error(err);
    }
};


export default createCartTable;