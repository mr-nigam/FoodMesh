import pool from 
'../config/postgre.js';


const recordDeliveryCompletionRepo = async({
    riderId,
    earnings = 50.00,
    deliveryDurationSeconds = 900,
    isOnTime = true,
    rating = null
})=>{

    const params = [
        riderId,
        earnings,
        deliveryDurationSeconds,
        isOnTime
    ];
    
    const query = `
        INSERT INTO rider_performance_metrics (
            rider_id,
            total_deliveries,
            completed_deliveries,
            total_earnings,
            total_delivery_time_seconds,
            on_time_deliveries,
            late_deliveries,
            last_delivery_at,
            completion_rate,
            on_time_rate
        )
        VALUES (
            $1,
            1,
            1,
            $2,
            $3,
            CASE WHEN $4 THEN 1 ELSE 0 END,
            CASE WHEN $4 THEN 0 ELSE 1 END,
            CURRENT_TIMESTAMP,
            100.00,
            CASE WHEN $4 THEN 100.00 ELSE 0.00 END
        )
        ON CONFLICT (rider_id) DO UPDATE
        SET
            total_deliveries = rider_performance_metrics.total_deliveries + 1,
            completed_deliveries = rider_performance_metrics.completed_deliveries + 1,
            total_earnings = rider_performance_metrics.total_earnings + $2,
            total_delivery_time_seconds = rider_performance_metrics.total_delivery_time_seconds + $3,
            average_delivery_time_seconds = (rider_performance_metrics.total_delivery_time_seconds + $3) / (rider_performance_metrics.completed_deliveries + 1),
            on_time_deliveries = rider_performance_metrics.on_time_deliveries + (CASE WHEN $4 THEN 1 ELSE 0 END),
            late_deliveries = rider_performance_metrics.late_deliveries + (CASE WHEN $4 THEN 0 ELSE 1 END),
            completion_rate = ROUND(((rider_performance_metrics.completed_deliveries + 1)::numeric / (rider_performance_metrics.total_deliveries + 1)::numeric) * 100, 2),
            on_time_rate = ROUND(((rider_performance_metrics.on_time_deliveries + (CASE WHEN $4 THEN 1 ELSE 0 END))::numeric / (rider_performance_metrics.completed_deliveries + 1)::numeric) * 100, 2),
            last_delivery_at = CURRENT_TIMESTAMP
        RETURNING *;
    `;
    
    const { rows } = await pool.query(
        query, 
        params
    );

    return rows[0];
};


export {
    recordDeliveryCompletionRepo
};
