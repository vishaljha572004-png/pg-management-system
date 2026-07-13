import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const run = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pg_management',
    });

    try {
      await connection.query(`
        ALTER TABLE student_profiles 
        ADD COLUMN profile_status ENUM('incomplete', 'submitted', 'rejected', 'approved') DEFAULT 'incomplete',
        ADD COLUMN rejection_reason TEXT NULL
      `);
      console.log('Added profile_status and rejection_reason columns.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Columns already exist.');
      } else {
        console.log('Error:', e.message);
      }
    }

    
    await connection.query(`
      UPDATE student_profiles sp
      JOIN users u ON sp.user_id = u.id
      SET sp.profile_status = 'submitted'
      WHERE u.status = 'pending' AND sp.profile_status = 'incomplete'
    `);
    
    
    await connection.query(`
      UPDATE student_profiles sp
      JOIN users u ON sp.user_id = u.id
      SET sp.profile_status = 'approved'
      WHERE u.status = 'verified' OR u.status = 'active'
    `);

    console.log('✅ Migration successful!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

run();
