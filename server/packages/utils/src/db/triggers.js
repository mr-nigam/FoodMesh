/**
 * Utility to attach an automatic `updated_at` trigger to any PostgreSQL table.
 * @param {import('pg').Pool | import('pg').Client} pool - PostgreSQL pool or client instance
 * @param {string} tableName - Name of the target database table
 */
const createUpdatedAtTrigger = async (pool, tableName) => {
  if(!pool || typeof pool.query !== 'function') {
    throw new Error("[DB Utils] Valid PostgreSQL pool or client instance is required.");
  }

  // Create reusable PostgreSQL function
  await pool.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Drop existing trigger to avoid conflicts on re-runs/migrations
  await pool.query(`
    DROP TRIGGER IF EXISTS set_updated_at_${tableName}
    ON ${tableName};
  `);

  // Attach trigger to table
  await pool.query(`
    CREATE TRIGGER set_updated_at_${tableName}
    BEFORE UPDATE ON ${tableName}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};


export{
    createUpdatedAtTrigger
};