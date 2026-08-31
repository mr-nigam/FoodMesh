import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import validateAddress from '../utils/validateAddress.js';


const addAddress = asyncHandler( async (req,res) => {

    const validatedData = validateAddress({
        label: req.body.label,
        recipientName: req.body.recipientName,
        recipientPhone: req.body.phone,
        addressLine1: req.body.addressLine1,
        addressLine2: req.body.addressLine2,
        landmark: req.body.landmark,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postalCode,
        countryCode: req.body.countryCode,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        formattedAddress: req.body.formattedAddress,
        isDefault: req.body.isDefault
    });

    const isDefault = validatedData[11];

    if(isDefault){
        const updateQuery = `
            UPDATE addresses 
            SET 
                is_default = FALSE 
            WHERE user_id = $1 
                AND is_default = TRUE 
                AND deleted_at IS NULL;
        `;

        await pool.query(
            updateQuery,
            [req.user.id]
        );
    }
    
    const insertQuery = `
        INSERT INTO addresses(
            user_id,
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
            formatted_address,
            is_default,
            location
        )
        VALUES(
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11, $12, 
            $13,
            ST_SetSRID(
                ST_MakePoint($14, $15),
                4326
            )::GEOGRAPHY
        )
        RETURNING
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
            is_default;
    `;

    const {rows} = await pool.query(
        insertQuery,
        [req.user.id, ...validatedData]
    );

    if(rows.length === 0){
        throw new ApiError(
            500,
            "Failed to add address"
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {address: rows[0]},
                "Address added successfully"
            )
        );
});

const fecthAllAddresses = asyncHandler( async (req,res) => {

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
        WHERE user_id = $1
            AND deleted_at IS NULL
        ORDER BY 
            is_default DESC, 
            created_at DESC;
    `;

    const {rows} = await pool.query(
        searchQuery,
        [req.user.id]
    );

    const addresses = rows;
    const message = addresses.length
        ?"All addresses fetched successfully"
        :"No address found";
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {addresses},
                message
            )
        );
});

const deleteAddress = asyncHandler( async (req,res) => {
    const addressId = req?.params?.addressId?.trim() || "";

    if(!addressId){
        throw new ApiError(
            400,
            "Please share a valid address id"
        );
    }

    // delete it now or push it queue for background jobs
    const deleteQuery = `
        UPDATE addresses
        SET deleted_at = CURRENT_TIMESTAMP,
            is_default = FALSE
        WHERE id = $1
            AND user_id = $2
            AND deleted_at IS NULL
        RETURNING id;
    `;

    const {rows} = await pool.query(
        deleteQuery,
        [addressId, req.user.id]
    );

    if(rows.length === 0){
        throw new ApiError(
            404,
            "Address not found or deleted already"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {addressId: rows[0].id},
                "Address deleted successfully"                
            )
        );
});

const fetchDefaultAddress = asyncHandler( async (req, res) => {

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
        WHERE user_id = $1
            AND is_default = true
            AND deleted_at IS NULL;
    `;

    let {rows} = await pool.query(
        searchQuery,
        [req.user.id]
    );

    if (rows.length === 0) {
        const fallbackQuery = `
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
            WHERE user_id = $1
                AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1;
        `;
        const fallbackResult = await pool.query(fallbackQuery, [req.user.id]);
        rows = fallbackResult.rows;
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { address: rows[0] || null },
                rows.length ? "Default address fetched successfully" : "No saved address"
            )
        );
});

const fecthAddress = asyncHandler( async (req, res) => {
    const addressId = req?.params?.addressId?.trim() || "";

    if(!addressId){
        throw new ApiError(
            400,
            "Please share a valid address id"
        );
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
        [addressId, req.user.id]
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

const editAddress = asyncHandler( async (req, res) => {
    const addressId = req.body.addressId || req.params?.addressId;

    if(!addressId){
        throw new ApiError(
            400,
            "Please share a valid address id"
        );
    }

    const validatedData = validateAddress({
        label: req.body.label,
        recipientName: req.body.recipientName,
        recipient_phone: req.body.phone,
        addressLine1: req.body.addressLine1,
        addressLine2: req.body.addressLine2,
        landmark: req.body.landmark,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postalCode,
        countryCode: req.body.countryCode,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        formattedAddress: req.body.formattedAddress,
        isDefault: req.body.isDefault
    });

    const isDefault = validatedData[11];

    if(isDefault){
        const updateQuery = `
            UPDATE addresses 
            SET 
                is_default = FALSE 
            WHERE user_id = $1 
                AND is_default = TRUE 
                AND deleted_at IS NULL;
        `;

        await pool.query(
            updateQuery,
            [req.user.id]
        );
    }

    const updateQuery = `
        UPDATE addresses
        SET
            label = $3,
            recipient_name = $4,
            recipient_phone = $5,
            address_line_1 = $6,
            address_line_2 = $7,
            landmark = $8,
            city = $9,
            state = $10,
            postal_code = $11,
            country_code = $12,
            formatted_address = $13,
            is_default = $14,
            location = ST_SetSRID(
                ST_MakePoint($15, $16),
                4326
            )::GEOGRAPHY,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
            AND user_id = $2
            AND deleted_at IS NULL
        RETURNING
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
            is_default;
    `;

    const {rows} = await pool.query(
        updateQuery,
        [addressId, req.user.id, ...validatedData]
    );

    if(rows.length === 0){
        throw new ApiError(
            404,
            "Address not found or edit failed"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {address: rows[0]},
                "Address updated successfully"
            )
        );
});


export {
    addAddress,
    fecthAddress,
    fecthAllAddresses,
    deleteAddress,
    editAddress,
    fetchDefaultAddress
}