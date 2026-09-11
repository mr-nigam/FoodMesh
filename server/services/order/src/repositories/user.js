import pool from '../config/postgre.js';


const fetchOrdersRepo = async({
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
                'order_restaurant_id', orr.id,
                'id', orr.restaurant_id,
                'name', orr.restaurant_name,
                'phone', orr.restaurant_phone,
                'location', orr.restaurant_location,
                'address', orr.restaurant_address,
                'subtotal', orr.subtotal,
                'tax_amount', orr.tax_amount,
                'delivery_fee', orr.delivery_fee,
                'discount_amount', orr.discount_amount,
                'total_amount', orr.total_amount,
                'status', orr.status
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

        JOIN order_restaurants orr
            ON o.id = orr.order_id

        JOIN order_items oi
            ON orr.id = oi.order_restaurant_id

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

            orr.id,
            orr.restaurant_id,
            orr.restaurant_name,
            orr.restaurant_phone,
            orr.restaurant_location,
            orr.restaurant_address,
            orr.subtotal,
            orr.tax_amount,
            orr.delivery_fee,
            orr.discount_amount,
            orr.total_amount,
            orr.status
        ORDER BY MIN(o.created_at) ASC;
    `;

    const {rows} = await pool.query(
        searchQuery,
        params
    );


    return rows;
};


export {
    fetchOrdersRepo
};