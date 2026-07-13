import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const alterDb = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pg_management',
    });

    console.log(`Connected to database.`);

    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        upi_id VARCHAR(255) NULL,
        account_name VARCHAR(255) NULL,
        qr_image_url VARCHAR(255) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    
    const [settingsRows] = await connection.query(`SELECT COUNT(*) as count FROM admin_settings`);
    if (settingsRows[0].count === 0) {
      await connection.query(`INSERT INTO admin_settings (upi_id, account_name) VALUES ('', '')`);
    }

    
    try {
      await connection.query(`ALTER TABLE rent_payments MODIFY COLUMN status ENUM('pending', 'paid', 'overdue', 'pending_verification', 'rejected') DEFAULT 'pending'`);
      console.log('Modified rent_payments status enum');
    } catch (e) {
      console.log('Error modifying rent_payments status enum:', e.message);
    }

    const rentCols = ['transaction_id VARCHAR(255)', 'screenshot_url VARCHAR(255)', 'rejection_reason TEXT'];
    for (const colDef of rentCols) {
      const colName = colDef.split(' ')[0];
      try {
        await connection.query(`ALTER TABLE rent_payments ADD COLUMN ${colDef}`);
        console.log(`Added ${colName} to rent_payments`);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.log(`Error adding ${colName}:`, e.message);
      }
    }

    
    try {
      await connection.query(`ALTER TABLE electricity_bills MODIFY COLUMN status ENUM('pending', 'paid', 'overdue', 'pending_verification', 'rejected') DEFAULT 'pending'`);
      console.log('Modified electricity_bills status enum');
    } catch (e) {
      console.log('Error modifying electricity_bills status enum:', e.message);
    }

    const elecCols = ['transaction_id VARCHAR(255)', 'screenshot_url VARCHAR(255)', 'rejection_reason TEXT', 'payment_date TIMESTAMP NULL'];
    for (const colDef of elecCols) {
      const colName = colDef.split(' ')[0];
      try {
        await connection.query(`ALTER TABLE electricity_bills ADD COLUMN ${colDef}`);
        console.log(`Added ${colName} to electricity_bills`);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.log(`Error adding ${colName}:`, e.message);
      }
    }

    console.log('✅ Database altered successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Alteration Error:', error);
    process.exit(1);
  }
};

alterDb();
