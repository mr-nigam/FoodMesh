import pool from 
'../config/postgre.js';


const fetchRiderMetricsRepo = async({
    riderId
})=>{

    const searchQuery = `
        SELECT
            id,
            rider_id,
            total_deliveries,
            completed_deliveries,
            rider_cancelled_deliveries,
            customer_cancelled_deliveries,
            completion_rate,
            average_rating,
            total_ratings,
            total_delivery_time_seconds,
            average_delivery_time_seconds,
            total_earnings,
            late_deliveries,
            on_time_deliveries,
            on_time_rate,
            last_delivery_at,
            created_at,
            updated_at
        FROM rider_performance_metrics
        WHERE rider_id = $1; 
    `;

    const { rows } = await pool.query(
        searchQuery, 
        [riderId]
    );

    return rows[0];
};


export {
    fetchRiderMetricsRepo
};
