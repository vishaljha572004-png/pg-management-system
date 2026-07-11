import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'pg_management',
});

async function migrate() {
  try {
    console.log('Adding is_phone_verified to users table...');
    try {
      await pool.execute('ALTER TABLE users ADD COLUMN is_phone_verified BOOLEAN DEFAULT FALSE');
      console.log('Added is_phone_verified successfully.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('is_phone_verified already exists.');
      } else {
        throw e;
      }
    }

    console.log('Updating otp_verification table...');
    try {
      await pool.execute('ALTER TABLE otp_verification ADD COLUMN expires_at TIMESTAMP');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
    
    try {
      await pool.execute('ALTER TABLE otp_verification ADD COLUMN attempts INT DEFAULT 0');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
    
    try {
      await pool.execute('ALTER TABLE otp_verification ADD COLUMN purpose VARCHAR(50)');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    try {
      await pool.execute('ALTER TABLE otp_verification MODIFY COLUMN otp VARCHAR(255) NOT NULL');
      console.log('Modified otp column to VARCHAR(255).');
    } catch(e) {
       console.log('Could not modify otp column', e);
    }
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
