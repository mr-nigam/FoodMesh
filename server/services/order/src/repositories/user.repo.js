import pool from '../config/postgre.js';


const fetchMyOrdersRepo = async({
    userId,
    orderId = null
}) => {

    let searchQuery = `
        SELECT
            o.id AS order_id,
            o.recipient_name,
            o.recipient_phone,
            o.delivery_address,
            o.status,
            o.subtotal,
            o.delivery_fee,
            o.tax_amount,
            o.discount_amount,
            o.total_amount,

            jsonb_build_object(
                'order_restaurant_id', or.id,
                'id', or.restaurant_id,
                'name', or.restaurant_name,
                'phone', or.restaurant_phone,
                'location', or.restaurant_location,
                'address', or.restaurant_address,
                'subtotal', or.subtotal,
                'tax_amount', or.tax_amount,
                'delivery_fee', or.delivery_fee,
                'discount_amount', or.discount_amount,
                'total_amount', or.total_amount,
                'status', or.status
            ) AS restaurant,

            jsonb_agg(
                jsonb_build_object(
                    'order_item_id', oi.id,
                    'id', oi.item_id,
                    'cart_id', oi.cart_id,
                    'item_name', oi.item_name,
                    'unit_price', oi.unit_price,
                    'quantity', oi.quantity,
                    'subtotal', oi.subtotal
                )
                ORDER BY oi.id ASC
            ) as ordered_items

        FROM orders AS o

        JOIN order_restaurants or
            ON o.id = or.order_id

        JOIN order_items oi
            ON or.id = oi.order_restaurant_id

        WHERE o.user_id = $1
    `;

    const params = [userId];
    if(orderId){
        searchQuery += ` AND o.id = $2`;

        params.push(orderId);
    }

    searchQuery += `
        AND o.deleted_at IS NULL

        GROUP BY
            o.id,
            o.recipient_name,
            o.recipient_phone,
            o.delivery_address,
            o.status,
            o.subtotal,
            o.delivery_fee,
            o.tax_amount,
            o.discount_amount,
            o.total_amount,

            or.id,
            or.restaurant_id,
            or.restaurant_name,
            or.restaurant_phone,
            or.restaurant_location,
            or.restaurant_address,
            or.subtotal,
            or.tax_amount,
            or.delivery_fee,
            or.discount_amount,
            or.total_amount,
            or.status
        ORDER BY MIN(o.created_at) ASC;
    `;

    const {rows} = await pool.query(
        searchQuery,
        params
    );


    return rows;
};


export {
    fetchMyOrdersRepo
};