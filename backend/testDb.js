import pool from './src/config/db.js';

const run = async () => {
  try {
    const [rooms] = await pool.execute('SELECT * FROM rooms ORDER BY room_number ASC');
    console.log('Rooms:', rooms);

    const [beds] = await pool.execute(`
      SELECT b.id as bed_id, b.room_id, b.bed_number, b.status as bed_status, 
             u.id as student_id, u.name as student_name 
      FROM beds b 
      LEFT JOIN users u ON b.student_id = u.id
      ORDER BY b.bed_number ASC
    `);
    console.log('Beds:', beds);

    const [students] = await pool.execute(`
      SELECT u.id, u.name, u.email 
      FROM users u 
      LEFT JOIN beds b ON u.id = b.student_id 
      WHERE u.role = 'student' AND b.id IS NULL
    `);
    console.log('Students:', students);

  } catch (error) {
    console.error('DB Error:', error);
  } finally {
    process.exit(0);
  }
};

run();
