import pool from '../config/postgre.js';


const fetchMyOrdersRepo = async({
    userId
}) => {

    const searchQuery = `
        SELECT
            o.id AS order_id,
    `;
};