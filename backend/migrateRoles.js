import pool from './src/config/db.js';
import bcrypt from 'bcrypt';

async function migrateRoles() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Create Roles Table
    console.log('Creating roles table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
      )
    `);

    // 2. Insert Default Roles
    console.log('Inserting default roles...');
    await connection.query(`
      INSERT IGNORE INTO roles (name) VALUES ('Super Admin'), ('Admin'), ('Student')
    `);

    // 3. Add role_id to Users table
    console.log('Adding role_id column to users table...');
    try {
      await connection.query('ALTER TABLE users ADD COLUMN role_id INT');
    } catch (err) {
       if (err.code !== 'ER_DUP_FIELDNAME') throw err;
       console.log('role_id column already exists');
    }

    // 4. Migrate Data
    console.log('Migrating existing user roles...');
    const [roles] = await connection.query('SELECT id, name FROM roles');
    const roleMap = {};
    roles.forEach(r => roleMap[r.name.toLowerCase()] = r.id);
    
    // Update users
    try {
        // Attempt to migrate using old role column if it still exists
        await connection.query(`UPDATE users SET role_id = ? WHERE role = 'student'`, [roleMap['student']]);
        await connection.query(`UPDATE users SET role_id = ? WHERE role = 'admin'`, [roleMap['admin']]);
        await connection.query(`UPDATE users SET role_id = ? WHERE role_id IS NULL`, [roleMap['student']]);
    } catch (e) {
        if (e.code !== 'ER_BAD_FIELD_ERROR') throw e;
        console.log('Old role column not found, skipping enum data migration.');
    }

    // 5. Add Foreign Key
    console.log('Adding foreign key constraint...');
    try {
      await connection.query(`
        ALTER TABLE users
        ADD CONSTRAINT fk_user_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
      `);
    } catch (err) {
       if (err.code !== 'ER_DUP_KEYNAME') {
           console.log('Constraint might already exist.');
       }
    }

    // 6. Create Default Super Admin
    console.log('Checking for Super Admin account...');
    const [superAdmins] = await connection.query('SELECT * FROM users WHERE email = ?', ['superadmin@pg.com']);
    if (superAdmins.length === 0) {
      console.log('Creating default Super Admin account...');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('superadmin123', salt);
      await connection.query(
        'INSERT INTO users (name, email, phone, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
        ['Super Administrator', 'superadmin@pg.com', '1112223334', hash, roleMap['super admin']]
      );
    } else {
        await connection.query('UPDATE users SET role_id = ? WHERE email = ?', [roleMap['super admin'], 'superadmin@pg.com']);
    }
    
    // 7. Drop old role column
    console.log('Dropping old role enum column...');
    try {
        await connection.query('ALTER TABLE users DROP COLUMN role');
    } catch (e) {
        console.log('Role column already dropped or does not exist.');
    }

    await connection.commit();
    console.log('Migration completed successfully!');
  } catch (error) {
    await connection.rollback();
    console.error('Migration failed:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

migrateRoles();
