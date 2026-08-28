import pool from 
'../config/postgre.js';


const createUpdatedAtTrigger = async (tableName) => {

    // create reusable postgres function
    await pool.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // drop old trigger if exists
    await pool.query(`
        DROP TRIGGER IF EXISTS set_updated_at_${tableName}
        ON ${tableName};
    `);

    // create trigger
    await pool.query(`
        CREATE TRIGGER set_updated_at_${tableName}
        BEFORE UPDATE ON ${tableName}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
};


export default createUpdatedAtTrigger;