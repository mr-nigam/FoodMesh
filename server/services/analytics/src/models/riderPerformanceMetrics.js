import pool from '../config/postgre.js';

import {
    createUpdatedAtTrigger
} from '@foodmesh/utils';


const createRiderPerformanceMetricsTable = async()=>{
    try{
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rider_performance_metrics (
                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),
                
                rider_id UNIQUE UUID NOT NULL
                    REFERENCES riders(id)
                    ON DELETE CASCADE,

                /*
                 * Delivery statistics
                 */
            
                total_deliveries INTEGER NOT NULL
                    DEFAULT 0
                    CHECK (total_deliveries >= 0),

                completed_deliveries INTEGER NOT NULL
                    DEFAULT 0
                    CHECK (completed_deliveries >= 0),

                rider_cancelled_deliveries INTEGER NOT NULL
                    DEFAULT 0
                    CHECK (cancelled_deliveries >= 0),

                customer_cancelled_deliveries INTEGER NOT NULL
                    DEFAULT 0
                    CHECK (rejected_deliveries >= 0),
\
                 * Completion
                 */
                completion_rate NUMERIC(5,2) NOT NULL
                    DEFAULT 0
                    CHECK (
                        completion_rate >= 0
                        AND completion_rate <= 100
                    ),
                
                 * Rating
                 */
                average_rating NUMERIC(3,2) NOT NULL
                    DEFAULT 5.00
                    CHECK (
                        average_rating >= 0
                        AND average_rating <= 5
                    ),

                total_ratings INTEGER NOT NULL
                    DEFAULT 0
                    CHECK (total_ratings >= 0),

                 /*
                 * Timing
                 */
                total_delivery_time_seconds BIGINT NOT NULL
                    DEFAULT 0
                    CHECK (total_delivery_time_seconds >= 0),

                average_delivery_time_seconds INTEGER
                    CHECK (average_delivery_time_seconds >= 0),

                 /*
                 * Earnings
                 */
                total_earnings NUMERIC(12,2) NOT NULL
                    DEFAULT 0
                    CHECK (total_earnings >= 0),

                /*
                 * Reliability
                 */
                late_deliveries INTEGER NOT NULL
                    DEFAULT 0
                    CHECK (late_deliveries >= 0),

                on_time_deliveries INTEGER NOT NULL
                    DEFAULT 0
                    CHECK (on_time_deliveries >= 0),

                on_time_rate NUMERIC(5,2) NOT NULL
                    DEFAULT 0
                    CHECK (
                        on_time_rate >= 0
                        AND on_time_rate <= 100
                    ),
                
                  /*
                 * Last activity
                 */
                last_delivery_at TIMESTAMPTZ,

                created_at TIMESTAMPTZ 
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ 
                    DEFAULT CURRENT_TIMESTAMP;
            );    
        `);

        await createUpdatedAtTrigger(pool, 'rider_performance_metrics');

        console.log("✅ Rider Performance Metrics table created successfully.");

    }catch(error){
        console.error("❌ Rider Performance Metrics table creation failed", error);
    }
};


export default createRiderPerformanceMetricsTable;