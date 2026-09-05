import pool from "../config/postgre.js";

import { 
    createUpdatedAtTrigger
} from '@foodmesh/utils';


const createOrderItemsTable = async() => {
    try{
        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                 order_id UUID NOT NULL
                    REFERENCES orders(id)
                    ON DELETE CASCADE,
                
                order_restaurant_id UUID NOT NULL
                    REFERENCES order_restaurants(id)
                    ON DELETE CASCADE,

                cart_id UUID UNIQUE NOT NULL,

                item_id UUID NOT NULL,

                item_name VARCHAR(255) NOT NULL,

                unit_price NUMERIC(12,2) NOT NULL,

                quantity INTEGER NOT NULL
                    CHECK (quantity > 0),

                subtotal NUMERIC(12,2) NOT NULL
                    CHECK (subtotal >= 0),

                created_at TIMESTAMPTZ NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ NOT NULL
                    DEFAULT CURRENT_TIMESTAMP
            );
        `);
            
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_order_items_order_restaurant_id
                ON order_items(order_restaurant_id);

            CREATE INDEX IF NOT EXISTS idx_order_items_item_id
                ON order_items(item_id);
        `);

        await createUpdatedAtTrigger(pool, 'order_items');

        console.log(
            "✅ Order Items table created successfully."
        );

    }catch(error){

        console.error(
            "❌ Orders Items table creation failed",
            error
        );

        throw error;
    }
};


export default createOrderItemsTable;