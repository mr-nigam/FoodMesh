import pkg from "pg";


const { Pool } = pkg;

const createPostgres = ({
    host,
    port,
    user,
    password,
    database,
    ...options
}) => {

    const pool = new Pool({
        host,
        port: Number(port),
        user,
        password,
        database,
        ...options
    });

    const connectDB = async () => {
        await pool.query("SELECT 1");
    };

    const closeDB = async () => {
        await pool.end();
    };

    return {
        pool,
        connectDB,
        closeDB
    };
};


export {
    createPostgres
};