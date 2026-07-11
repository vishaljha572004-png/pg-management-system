import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD || '12345',
    database: 'pg_management'
  });
  
  try {
      const [pgs] = await conn.execute(`
      SELECT 
        p.id, p.name, p.org_code, p.owner_name, p.contact_number, p.email, p.status, p.created_at,
        (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE u.pg_id = p.id AND r.name = 'Student') as total_students,
        (SELECT name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.pg_id = p.id AND r.name = 'Admin' LIMIT 1) as admin_name,
        (SELECT email FROM users u JOIN roles r ON u.role_id = r.id WHERE u.pg_id = p.id AND r.name = 'Admin' LIMIT 1) as admin_email,
        (SELECT phone FROM users u JOIN roles r ON u.role_id = r.id WHERE u.pg_id = p.id AND r.name = 'Admin' LIMIT 1) as admin_phone,
        (SELECT COUNT(*) FROM rooms r WHERE r.pg_id = p.id) as total_rooms,
        (SELECT COUNT(*) FROM beds b WHERE b.pg_id = p.id AND b.status = 'occupied') as occupied_rooms,
        (SELECT COUNT(*) FROM beds b WHERE b.pg_id = p.id AND b.status = 'available') as available_rooms
      FROM pgs p
      ORDER BY p.created_at DESC
    `);
    console.log("Success fetching PGs:");
    console.log(pgs.length);
  } catch (error) {
    console.error("Error fetching PGs:", error);
  }
  
  try {
      const id = 1; // Assuming PG ID 1 exists
      const [pgRows] = await conn.execute(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE u.pg_id = p.id AND r.name = 'Student') as total_students,
        (SELECT COUNT(*) FROM rooms r WHERE r.pg_id = p.id) as total_rooms,
        (SELECT COUNT(*) FROM beds b WHERE b.pg_id = p.id AND b.status = 'occupied') as occupied_rooms,
        (SELECT COUNT(*) FROM beds b WHERE b.pg_id = p.id AND b.status = 'available') as available_rooms,
        (SELECT IFNULL(SUM(amount), 0) FROM rent_payments rp WHERE rp.pg_id = p.id AND rp.status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM complaints c WHERE c.pg_id = p.id AND c.status = 'open') as open_complaints
      FROM pgs p WHERE p.id = ?
    `, [id]);
    console.log("Success fetching Hostel details:", pgRows.length);
  } catch (error) {
    console.error("Error fetching Hostel details:", error);
  }

  process.exit(0);
}
run();
