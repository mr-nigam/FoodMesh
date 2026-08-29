import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';


const fetchAddressRepo = async ({
    addressId,
    userId
}) => {

    const addressQuery = `
        SELECT 
            id,
            label,
            recipient_name,
            phone,
            address_line_1,
            address_line_2,
            landmark,
            city,
            state,
            postal_code,
            country_code,
            ST_Y(location::geometry) AS latitude,
            ST_X(location::geometry) AS longitude,
            formatted_address
        FROM addresses
        WHERE id = $1
            AND user_id = $2
            AND deleted_at IS NULL;
        `;
        
    const { rows } = await pool.query(
        addressQuery,
        [addressId?.trim(), userId]
    );

    if(rows.length === 0){
        throw new ApiError(
            404,
            "Selected delivery address not found"
        );
    }

    return rows[0];
};

const fetchCartItemsRepo = async({
    userId,
    targetRestId
}) => {

    const cartQuery = `
        SELECT 
            c.id AS cart_id,
            c.restaurant_id,
            c.item_id,
            c.quantity,
            c.price AS cart_price,
            mi.name AS item_name,
            mi.price AS menu_price,
            mi.is_available,
            r.name AS restaurant_name,
            r.is_open
        FROM carts c
        JOIN menu_items mi ON c.item_id = mi.id
        JOIN restaurants r ON c.restaurant_id = r.id
        WHERE c.user_id = $1
          AND c.quantity > 0
          AND ($2::uuid IS NULL OR c.restaurant_id = $2::uuid)
          AND mi.deleted_at IS NULL
          AND r.deleted_at IS NULL;
    `;

    const { rows: cartRows } = await pool.query(
        cartQuery,
        [userId, targetRestId]
    );

    if(cartRows.length === 0){
        throw new ApiError(
            400,
            "Your cart is empty for the requested restaurant(s)"
        );
    }

    return cartRows;
};

const createOrderInOrdersTableRepo = async({}) => { };

const createOrderInRestarurantTableRepo = async({ }) => { };

const createOrderInItemsTableRepo = async({ }) => { };


export {
    fetchAddressRepo,
    fetchCartItemsRepo,
    createOrderInOrdersTableRepo,
    createOrderInRestarurantTableRepo,
    createOrderInItemsTableRepo
};