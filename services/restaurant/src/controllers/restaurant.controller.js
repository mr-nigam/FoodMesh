import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';


const addRestaurant = asyncHandler(async (req, res)=>{
    const user = req.user;
    
    if(!user){
        throw new ApiError(
            401,
            "Unauthorized"
        );
    }

    let query = `
        SELECT
            id,
            name,
            email,
            phone,
            address
        FROM restaurants
            WHERE owner_id = $1
            AND deleted_at IS NULL
            AND deactivated_at IS NULL;
    `;

    const existingRestruant = await pool.query(
        query,
        [user.owner_id]
    );

    if(existingRestruant){
        return res
            .status(400)
            .json(
                new ApiResponse(
                    400,
                {RestDet: existingRestruant.rows[0]},
                "You already have a restaurant"
                )
            );
    }

    const {
        name,
        description,
        latitude,
        longitude,
        formattedAddress,
        phone,
        email
    } = req.body;
    
    if(!name || !latitude || !longitude){
        throw new ApiError(
            400,
            "Please give all the mandaroty details"
        );
    }

    const file = req.file;

    if(!file){
        throw new ApiError(
            400,
            "Please upload images"
        );
    }

});


export {
    addRestaurant
};