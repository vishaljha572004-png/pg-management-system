import pool from './src/config/db.js';

async function run() {
  try {
    const [occ] = await pool.execute(`
      SELECT 
        COUNT(id) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds
      FROM beds
    `);
    console.log('Occupancy:', occ[0]);
    
    const [comp] = await pool.execute(`
      SELECT status, COUNT(*) as count
      FROM complaints
      GROUP BY status
    `);
    console.log('Complaints:', comp);
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    process.exit(0);
  }
}
run();
