import pool from '../config/postgre.js';

import { 
    ApiError,
    ApiResponse,
    asyncHandler
} from '@foodmesh/utils';

import {
    uploadImage
} from '../services/imageUpload.service.js';


const addMenuItem = asyncHandler(async (req,res) => {
    const restaurant = req.restaurant;
    
    const {
        name,
        description,
        price,
        category
    } = req.body;

    const parsedPrice = Number(price);

    if(!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        throw new ApiError(
            400,
            "Price must be a valid non-negative number"
        );
    }

    const trimmedName = name?.trim() || "";
    const trimmedDescription = description?.trim() || "";
    const trimmedCategory = category?.trim() || "";

    if(!trimmedName || !trimmedDescription){
        throw new ApiError(
            400,
            "Name and description are required" 
        );
    }

    const pictureUrl = await uploadImage(req.file);
    const picturesUrls = [pictureUrl]; // Array of image URLs

    const insertQuery = `
        INSERT INTO menu_items(
            restaurant_id,
            name,
            description,
            pictures_urls,
            price,
            category
        )VALUES(
            $1, $2, $3,
            $4, $5, $6
        )
        RETURNING
            id,
            restaurant_id,
            name,
            description,
            pictures_urls,
            price,
            is_available;
    `;

    const values = [
        restaurant.id,
        trimmedName,
        trimmedDescription,
        picturesUrls,
        parsedPrice,
        trimmedCategory
    ];

    const {rows} = await pool.query(
        insertQuery, values
    );

    if(rows.rowCount===0){
        throw new ApiError(
            500,
            "Failed to create item"
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {
                    menuItem: rows[0]
                },
                "Item added successfully"
            )
        );
});

const fetchAllItems = asyncHandler(async (req,res) => {
    const {restaurantId} = req.params;

    const searchQuery = `
        SELECT
            id,
            restaurant_id,
            name,
            description,
            pictures_urls,
            price,
            is_available,
            category
        FROM menu_items
        WHERE restaurant_id = $1
        ORDER BY category ASC, name ASC;
    `;

    const {rows} = await pool.query(
        searchQuery, [restaurantId]
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    menuItems: rows
                },
                "Menu items fetched successfully"
            )
        );
});

const updateMenuItem = asyncHandler(async (req,res) => {
    const restaurant = req.restaurant;
    const { itemId } = req.params;

    if(!itemId){
        throw new ApiError(
            400,
            "Item id is required"
        );
    }

    const {
        name,
        description,
        price,
        category
    } = req.body;

    const updates = [];
    const values = [];

    let parameterIndex = 1;

    if (name !== undefined) {
        const trimmedName = name.trim();

        if(!trimmedName){
            throw new ApiError(
                400,
                "Name cannot be empty"
            );
        }

        updates.push(`name = $${parameterIndex++}`);
        values.push(trimmedName);
    }

    if(description !== undefined){
        const trimmedDescription = description.trim();

        if(!trimmedDescription){
            throw new ApiError(
                400,
                "Description cannot be empty"
            );
        }

        updates.push(
            `description = $${parameterIndex++}`
        );

        values.push(trimmedDescription);
    }

    if(price !== undefined){
        const parsedPrice = Number(price);

        if(
            !Number.isFinite(parsedPrice) ||
            parsedPrice < 0
        ){
            throw new ApiError(
                400,
                "Price must be a valid non-negative number"
            );
        }

        updates.push(
            `price = $${parameterIndex++}`
        );

        values.push(parsedPrice);
    }

    if(category !== undefined){
        updates.push(
            `category = $${parameterIndex++}`
        );

        values.push(
            category?.trim() || null
        );
    }

    if(updates.length === 0){
        throw new ApiError(
            400,
            "No fields provided for update"
        );
    }

    if(updates.length === 0){
        throw new ApiError(
            400,
            "No fields provided for update"
        );
    }

    values.push(itemId);
    values.push(restaurant.id);

    const updateQuery = `
        UPDATE menu_items
        SET
            ${updates.join(", ")}
        WHERE id = $${parameterIndex++}
            AND restaurant_id = $${parameterIndex++}
        RETURNING
            id,
            restaurant_id,
            name,
            description,
            pictures_urls,
            price,
            is_available,
            category;    
    `;

    const { rows } = await pool.query(
        updateQuery,
        values
    );
    
    if(rows.length === 0){
        throw new ApiError(
            404,
            "Menu item not found"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    menuItem: rows[0]
                },
                "Menu item updated successfully"
            )
        );

});

const deleteMenuItem = asyncHandler(async (req,res) => {
    const restaurant = req.restaurant;
    const { itemId } = req.params;

    if(!itemId){
        throw new ApiError(
            400,
            "Item id is required"
        );
    }

    const deleteQuery = `
        DELETE FROM menu_items
        WHERE id = $1
        AND restaurant_id = $2
        RETURNING
            id,
            restaurant_id,
            name,
            description,
            pictures_urls,
            price,
            is_available;
    `;

    const { rows } = await pool.query(
        deleteQuery,
        [itemId, restaurant.id]
    );

    if(rows.length === 0){
        throw new ApiError(
            404,
            "Menu item not found"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    menuItem: rows[0]
                },
                "Menu item deleted successfully"
            )
        );

});

const toggleItemAvailability = asyncHandler(async(req,res)=>{
    const restaurant = req.restaurant;
    const { itemId } = req.params;

    if(!itemId){
        throw new ApiError(
            400,
            "Item id is required"
        );
    }

    const updateQuery = `
        UPDATE menu_items
        SET
            is_available = NOT is_available
        WHERE id = $1
            AND restaurant_id = $2
        RETURNING
            id,
            restaurant_id,
            name,
            description,
            pictures_urls,
            price,
            is_available,
            category;
    `;

    const { rows } = await pool.query(
        updateQuery,
        [
            itemId,
            restaurant.id
        ]
    );

    if(rows.length === 0){
        throw new ApiError(
            404,
            "Menu item not found"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    menuItem: rows[0]
                },
                "Item availability updated successfully"
            )
        );

});


export {
    addMenuItem,
    fetchAllItems,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability
};