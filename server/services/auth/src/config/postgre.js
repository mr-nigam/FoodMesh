import 'dotenv/config';
import pkg from 'pg';

const { Pool } = pkg;


const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const conectDB = async()=>{
    await pool.query('SELECT 1');   
};


export { conectDB };
export default pool;