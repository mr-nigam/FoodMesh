import pool from '../config/postgre.js';


const fetchCartItemsRepo = async ({
    userId,
    restaurantId = null
}) => {

    let searchQuery = `
        SELECT
            r.id AS restaurant_id,

            jsonb_build_object(
                'id', r.id,
                'name', r.name,
                'address', r.address,
                'location', r.location,
                'is_open', r.is_open,
                'phone', r.phone,
                'pictures', r.pictures_urls
            ) AS restaurant,

            jsonb_agg(
                jsonb_build_object(
                    'cart_id', c.id,
                    'item_id', mi.id,
                    'name', mi.name,
                    'category', mi.category,
                    'pictures', mi.pictures_urls,
                    'quantity', c.quantity,
                    'price', c.price,
                    'is_available', mi.is_available
                )
                ORDER BY c.created_at ASC
            ) AS items,

            SUM(c.quantity) AS total_qty,
            SUM(c.quantity * c.price) AS total_value

        FROM carts AS c

        JOIN menu_items AS mi
            ON c.item_id = mi.id

        JOIN restaurants AS r
            ON c.restaurant_id = r.id

        WHERE c.user_id = $1 
    `;

    const params = [userId];

    if(restaurantId){
        searchQuery += `
            AND r.id = $2 
        `;

        params.push(restaurantId);
    }

    searchQuery += `
            AND c.quantity > 0
            AND mi.deleted_at IS NULL
            AND mi.deactivated_at IS NULL
            AND r.deleted_at IS NULL
            AND r.deactivated_at IS NULL
        GROUP BY
            r.id,
            r.name,
            r.address,
            r.location,
            r.is_open,
            r.phone,
            r.pictures_urls

        ORDER BY MIN(c.created_at) ASC;
    `;

    const { rows } = await pool.query(
        searchQuery,
        params
    );

    return rows;
};

const deleteCartDataRepo = async({
    userId,
    restaurantId,
    requestType
}) =>{

    let deleteCartDataQuery = `
        DELETE FROM carts
        WHERE user_id = $1 
    `;

    const params = [userId];
    if(requestType === "single"){
        deleteCartDataQuery +=`
            AND restaurant_id = $2
        RETURNING
            id;
        `;

        params.push(restaurantId);
    }else{
        deleteCartDataQuery +=`
        RETURNING
            id;
        `;
    }

    const {rows} = await pool.query(
        deleteCartDataQuery,
        params
    );

    return rows;
}

export {
    fetchCartItemsRepo,
    deleteCartDataRepo
};