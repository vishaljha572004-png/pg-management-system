import pool from './src/config/db.js';

const fixDb = async () => {
  try {
    console.log('Dropping old tables to fix schema mismatch...');
    
    // Disable foreign key checks temporarily to drop tables in any order
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    
    await pool.query('DROP TABLE IF EXISTS rent_payments');
    await pool.query('DROP TABLE IF EXISTS electricity_bills');
    await pool.query('DROP TABLE IF EXISTS complaints');
    await pool.query('DROP TABLE IF EXISTS beds');
    await pool.query('DROP TABLE IF EXISTS rooms');
    await pool.query('DROP TABLE IF EXISTS users');
    
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Old tables dropped. Re-creating with correct schema...');
    
    const tables = [
      `CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('student', 'admin') DEFAULT 'student',
        profile_photo VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        refresh_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_number VARCHAR(50) UNIQUE NOT NULL,
        capacity INT NOT NULL,
        rent_per_bed DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE beds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        bed_number VARCHAR(10) NOT NULL,
        student_id INT UNIQUE NULL,
        status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE rent_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        billing_month VARCHAR(20) NOT NULL,
        status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
        payment_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE electricity_bills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        billing_month VARCHAR(20) NOT NULL,
        due_date DATE NOT NULL,
        status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE complaints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
        resolution_remarks TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ];

    for (let query of tables) {
      await pool.query(query);
    }
    
    console.log('✅ Database schema fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    process.exit(1);
  }
};

fixDb();
