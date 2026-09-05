import pool from '../config/postgre.js';

import {
    ApiError,
    ApiResponse,
    asyncHandler
} from '@foodmesh/utils';


const fetchAddress = asyncHandler( async (req, res) => {

    const userId = req?.params?.userId?.trim() ?? "";
    const addressId = req?.params?.addressId?.trim() ?? "";

    if(
        !userId || 
        !addressId
    ){
        throw new ApiError(400, "Please provide user and address id");
    }
    
    const searchQuery = `
        SELECT
            id,
            label,
            recipient_name,
            recipient_phone,
            address_line_1,
            address_line_2,
            landmark,
            city,
            state,
            postal_code,
            country_code,
            ST_Y(location::geometry) AS latitude,
            ST_X(location::geometry) AS longitude,
            formatted_address,
            is_default
        FROM addresses
        WHERE id = $1
            AND user_id = $2
            AND deleted_at IS NULL;
    `;

    const {rows} = await pool.query(
        searchQuery,
        [addressId, userId]
    );

    if(rows.length === 0){
        throw new ApiError(
            404,
            "Address not found"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {address: rows[0]},
                "Address fetched successfully"
            )
        );
});


export {
    fetchAddress
}