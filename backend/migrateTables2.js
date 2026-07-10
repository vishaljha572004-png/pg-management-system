import pool from './src/config/db.js';

async function run() {
  const connection = await pool.getConnection();
  try {
    const tables = ['notices', 'notifications'];
    for (const table of tables) {
      try {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN pg_id INT NULL`);
      } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') console.error(e); }
      
      try {
        await connection.query(`ALTER TABLE ${table} ADD CONSTRAINT fk_${table}_pg FOREIGN KEY (pg_id) REFERENCES pgs(id) ON DELETE CASCADE`);
      } catch (e) {}
      
      // Update existing
      const [existingPGs] = await connection.query('SELECT id FROM pgs WHERE org_code = ?', ['DEFAULT001']);
      if (existingPGs[0]) {
        await connection.query(`UPDATE ${table} SET pg_id = ? WHERE pg_id IS NULL`, [existingPGs[0].id]);
      }
    }
    console.log('Success');
  } catch(e) {
    console.error(e);
  } finally {
    connection.release();
    process.exit();
  }
}
run();
