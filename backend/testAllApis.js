import pool from './src/config/db.js';

const run = async () => {
  try {
    console.log('Testing Rent Query:');
    let rentQuery = `
      SELECT rp.*, u.name as student_name, r.room_number, b.bed_number
      FROM rent_payments rp
      JOIN users u ON rp.student_id = u.id
      JOIN beds b ON b.student_id = u.id
      JOIN rooms r ON b.room_id = r.id
      WHERE 1=1
    `;
    const [records] = await pool.execute(rentQuery);
    console.log('Rent OK:', records.length);
  } catch(e) {
    console.error('Rent Error:', e);
  }

  try {
    console.log('Testing Electricity Query:');
    let elecQuery = `
      SELECT eb.*, r.room_number
      FROM electricity_bills eb
      JOIN rooms r ON eb.room_id = r.id
      ORDER BY eb.id DESC
    `;
    const [ebRecords] = await pool.execute(elecQuery);
    console.log('Electricity OK:', ebRecords.length);
  } catch(e) {
    console.error('Electricity Error:', e);
  }
  
  try {
    console.log('Testing Complaints Query:');
    let compQuery = `
      SELECT c.*, u.name as student_name, r.room_number
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN beds b ON u.id = b.student_id
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY c.created_at DESC
    `;
    const [cRecords] = await pool.execute(compQuery);
    console.log('Complaints OK:', cRecords.length);
  } catch(e) {
    console.error('Complaints Error:', e);
  }

  try {
    console.log('Testing Admin Directory Query:');
    let dQuery = `
      SELECT u.id, u.name, u.email, u.phone, u.status, b.bed_number, r.room_number
      FROM users u
      LEFT JOIN beds b ON u.id = b.student_id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE u.role = 'student'
      ORDER BY u.name ASC
    `;
    const [dRecords] = await pool.execute(dQuery);
    console.log('Directory OK:', dRecords.length);
  } catch(e) {
    console.error('Directory Error:', e);
  }
  
  process.exit(0);
};

run();
