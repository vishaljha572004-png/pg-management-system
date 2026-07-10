import pool from './src/config/db.js';

async function migratePaymentMode() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log('1. Checking if payment_mode column exists in pgs table...');
    const [columns] = await connection.query(`SHOW COLUMNS FROM pgs LIKE 'payment_mode'`);
    
    if (columns.length === 0) {
        console.log('2. Adding payment_mode column to pgs table...');
        await connection.query(`
            ALTER TABLE pgs 
            ADD COLUMN payment_mode ENUM('development', 'qr_utr', 'live_gateway') DEFAULT 'development'
        `);
        console.log('Column added successfully.');
    } else {
        console.log('Column payment_mode already exists.');
    }

    await connection.commit();
    console.log('✅ Payment Mode Migration Completed Successfully!');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Migration failed:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

migratePaymentMode();
