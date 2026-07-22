import pool, { conectDB }
from '../config/postgre.js';


const bootstrapDB = async () => {
    try{
        await conectDB();

        console.log("✅ PostgreSQL Connected");
    }catch(error){

        console.error('❌ PostgreSQL Connection Failed');
        console.error(error);

        process.exit(1);
    }
};


pool.on('error', (error) => {

    console.error('❌ PostgreSQL Pool Error');
    console.error(error);
});


process.on('SIGINT', async () => {

    await pool.end();

    console.log('🛑 PostgreSQL Pool Closed');

    process.exit(0);
});


export default bootstrapDB;