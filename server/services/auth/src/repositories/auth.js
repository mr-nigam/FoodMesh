import pool from '../config/postgre.js';


const loginRepo = async({
        email,
        name,
        picture
})=>{

    const params = [
        email,
        name,
        picture
    ];

    const loginQuery = `
        INSERT INTO users(
            email, name, profile_picture_url
        )VALUES(
            $1, $2, $3
        )
        ON CONFLICT (email)
        DO UPDATE SET
            name = EXCLUDED.name,
            profile_picture_url = EXCLUDED.profile_picture_url
        RETURNING
            id,
            name,
            email,
            role,
            profile_picture_url,
            professional_id;
    `;

    const {rows} = await pool.query(
        loginQuery,
        params
    );

    return rows[0];
};

const updateRoleRepo = async({
    userId,
    role
})=>{

     const updateQuery = `
        UPDATE users
        SET 
            role = $1
        WHERE id = $2
            AND deleted_at IS NULL
        RETURNING
            id,
            name,
            email,
            role,
            profile_picture_url,
            professional_id;
    `;
    
    const {rows} = await pool.query(
        updateQuery,
        [role, userId]
    );

    return rows[0];
};

const getMyProfileRepo = async({
    userId
})=>{

      const searchQuery = `
        SELECT *
        FROM users
        WHERE id = $1
            AND deleted_at IS NULL;
    `;
    
    const {rows} = await pool.query(
        searchQuery, 
        [userId]
    );

    return rows[0];
};


export {
    loginRepo,
    updateRoleRepo,
    getMyProfileRepo
}