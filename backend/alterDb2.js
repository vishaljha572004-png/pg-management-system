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

    console.log('Connected to database.');

    
    try {
      await connection.query(`
        ALTER TABLE users 
        MODIFY COLUMN status ENUM('pending', 'verified', 'active', 'inactive', 'notice_period', 'vacated', 'removed', 'blacklisted') DEFAULT 'pending'
      `);
      console.log('Updated users status ENUM.');
    } catch (e) {
      console.log('Error updating users status:', e.message);
    }

    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        dob DATE NULL,
        gender VARCHAR(20) NULL,
        blood_group VARCHAR(10) NULL,
        permanent_address TEXT NULL,
        current_address TEXT NULL,
        occupation VARCHAR(100) NULL,
        student_id_number VARCHAR(100) NULL,
        
        father_name VARCHAR(100) NULL,
        father_mobile VARCHAR(20) NULL,
        mother_name VARCHAR(100) NULL,
        mother_mobile VARCHAR(20) NULL,
        local_guardian_name VARCHAR(100) NULL,
        local_guardian_mobile VARCHAR(20) NULL,
        emergency_contact VARCHAR(20) NULL,
        
        aadhaar_front VARCHAR(255) NULL,
        aadhaar_back VARCHAR(255) NULL,
        pan_card VARCHAR(255) NULL,
        college_id_doc VARCHAR(255) NULL,
        photo VARCHAR(255) NULL,
        selfie VARCHAR(255) NULL,
        
        police_status ENUM('pending', 'submitted', 'approved', 'rejected') DEFAULT 'pending',
        police_verification_number VARCHAR(100) NULL,
        police_station_name VARCHAR(255) NULL,
        police_verification_date DATE NULL,
        police_document VARCHAR(255) NULL,
        police_remarks TEXT NULL,
        
        exit_date DATE NULL,
        exit_reason VARCHAR(255) NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Created student_profiles table.');

    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Created notifications table.');

    
    try {
      await connection.query(`
        ALTER TABLE notices
        ADD COLUMN target_type ENUM('all', 'room', 'individual') DEFAULT 'all',
        ADD COLUMN target_id INT NULL,
        ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
        ADD COLUMN expiry_date DATE NULL
      `);
      console.log('Modified notices table.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Notice columns already exist.');
      } else {
        console.log('Error modifying notices:', e.message);
      }
    }

    console.log('✅ Phase 2 Database altered successfully!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

run();
