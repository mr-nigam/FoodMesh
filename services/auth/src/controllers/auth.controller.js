import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/postgre.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';


const loginUser = asyncHandler(async (req,res) => {
    try{
        const {email, name, picture} = req.body;

        const query = `
            SELECT * 
            FROM users
                WHERE email = $1
                AND deleted_at IS NULL
                AND deactivated_at IS NULL;
        `;
        
        const result = await pool.query(query,[email]);
        let user = result.rows[0];
        
        // not registered, make new id
        if(result.rowCount === 0){
            const query = `
                INSERT INTO users(
                    email, name, picture
                )
                VALUES(
                    $1, $2, $3
                )
                RETURNING
                    id*,
                    name,
                    email,
                    picture;
            `;

            const result = await pool.query(
                query,
                [email,name,picture]
            );

            user = result.rows[0];
        }
        
        const token = jwt.sign({user}, process.env.JWT_SEC,{
            expiresIn: "15d" 
        });
        
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {user: user},
                    "User logged in successfully"
                )
            );

    }catch(err){

    }
});


export {
    loginUser
};