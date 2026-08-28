import pool from "../config/postgre.js";

import createUpdatedAtTrigger
from "../utils/dbTriggers.js";


const createOrderRestaurantTable = async () => {
    try {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_restaurants (
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

                order_id UUID NOT NULL
                    REFERENCES orders(id)
                    ON DELETE CASCADE,

                restaurant_id UUID NOT NULL,

                restaurant_name VARCHAR(255) NOT NULL,

                subtotal NUMERIC(12,2) NOT NULL
                    CHECK (subtotal >= 0),

                tax_amount NUMERIC(12,2) NOT NULL
                    DEFAULT 0
                    CHECK (tax_amount >= 0),

                delivery_fee NUMERIC(12,2) NOT NULL
                    DEFAULT 0
                    CHECK (delivery_fee >= 0),

                discount_amount NUMERIC(12,2) NOT NULL
                    DEFAULT 0
                    CHECK (discount_amount >= 0),

                total_amount NUMERIC(12,2) NOT NULL
                    CHECK (total_amount >= 0),

                status VARCHAR(30) NOT NULL
                    DEFAULT 'pending'
                    CHECK (
                        status IN (
                            'placed',
                            'accepted',
                            'preparing',
                            'ready_for_rider',
                            'rider_assigned',
                            'picked_up',
                            'on_the_way',
                            'delivered',
                            'cancelled'
                        )
                    ),

                created_at TIMESTAMPTZ NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                -- One restaurant can occur only once within an order.
                CONSTRAINT uq_order_restaurants_order_restaurant
                    UNIQUE (order_id, restaurant_id)
            );
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_order_restaurants_restaurant_id
                ON order_restaurants(restaurant_id);

            CREATE INDEX IF NOT EXISTS idx_order_restaurants_status
                ON order_restaurants(status);
        `);

        await createUpdatedAtTrigger("order_restaurants");

        console.log(
            "✅ Order Restaurants table created successfully."
        );

    }catch(error){

        console.error(
            "❌ Order Restaurants table creation failed",
            error
        );

        throw error;
    }
};


export default createOrderRestaurantTable;