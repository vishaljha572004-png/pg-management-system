import pool from './src/config/db.js';

async function migrateToSaaS() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log('1. Creating `pgs` (tenants) table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pgs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        org_code VARCHAR(50) NOT NULL UNIQUE,
        logo VARCHAR(255),
        cover_image VARCHAR(255),
        owner_name VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pin_code VARCHAR(20),
        contact_number VARCHAR(20),
        email VARCHAR(255),
        upi_id VARCHAR(255),
        qr_code VARCHAR(255),
        status ENUM('active', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('2. Preparing `users` table for multi-tenancy...');
    try { await connection.query('ALTER TABLE users DROP INDEX email'); } catch (e) {}
    try { await connection.query('ALTER TABLE users DROP INDEX phone'); } catch (e) {}
    
    try {
        await connection.query('ALTER TABLE users ADD COLUMN pg_id INT NULL');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    try {
        await connection.query('ALTER TABLE users ADD CONSTRAINT unique_phone_pg UNIQUE (phone, pg_id)');
    } catch (e) {
        if (e.code !== 'ER_DUP_KEYNAME') {
             console.log('Constraint unique_phone_pg may already exist or error:', e.message);
        }
    }
    
    try {
        await connection.query('ALTER TABLE users ADD CONSTRAINT unique_email_pg UNIQUE (email, pg_id)');
    } catch (e) {
        if (e.code !== 'ER_DUP_KEYNAME') {
             console.log('Constraint unique_email_pg may already exist or error:', e.message);
        }
    }

    try {
        await connection.query('ALTER TABLE users ADD CONSTRAINT fk_user_pg FOREIGN KEY (pg_id) REFERENCES pgs(id) ON DELETE CASCADE');
    } catch (e) {
        if (e.code !== 'ER_DUP_KEYNAME') {
            console.log('Constraint fk_user_pg may already exist.');
        }
    }

    console.log('3. Modifying core tables...');
    const tables = ['rooms', 'beds', 'rent_payments', 'electricity_bills', 'complaints'];
    
    for (const table of tables) {
        try {
            await connection.query(`ALTER TABLE ${table} ADD COLUMN pg_id INT NULL`);
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
        }

        try {
            await connection.query(`ALTER TABLE ${table} ADD CONSTRAINT fk_${table}_pg FOREIGN KEY (pg_id) REFERENCES pgs(id) ON DELETE CASCADE`);
        } catch (e) {
            if (e.code !== 'ER_DUP_KEYNAME') {
                 console.log(`Constraint fk_${table}_pg may already exist.`);
            }
        }
    }

    try { await connection.query('ALTER TABLE rooms DROP INDEX room_number'); } catch (e) {}
    try {
        await connection.query('ALTER TABLE rooms ADD CONSTRAINT unique_room_pg UNIQUE (room_number, pg_id)');
    } catch (e) {
        if (e.code !== 'ER_DUP_KEYNAME') {
             console.log('Constraint unique_room_pg may already exist or error:', e.message);
        }
    }

    console.log('4. Creating Default Seed Data...');
    const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', ['Super Admin']);
    const superAdminRoleId = roles[0]?.id;
    if (superAdminRoleId) {
        await connection.query('UPDATE users SET pg_id = NULL WHERE role_id = ?', [superAdminRoleId]);
    }

    const [existingPGs] = await connection.query('SELECT id FROM pgs WHERE org_code = ?', ['DEFAULT001']);
    let defaultPgId = existingPGs[0]?.id;

    if (!defaultPgId) {
        const [result] = await connection.query(
            'INSERT INTO pgs (name, org_code, owner_name) VALUES (?, ?, ?)',
            ['Default Migrated PG', 'DEFAULT001', 'Default Owner']
        );
        defaultPgId = result.insertId;
    }

    if (defaultPgId) {
        await connection.query('UPDATE users SET pg_id = ? WHERE pg_id IS NULL AND role_id != ?', [defaultPgId, superAdminRoleId]);
        for (const table of tables) {
            await connection.query(`UPDATE ${table} SET pg_id = ? WHERE pg_id IS NULL`, [defaultPgId]);
        }
    }

    await connection.commit();
    console.log('✅ Multi-Tenant SaaS Migration Completed Successfully!');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Migration failed:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

migrateToSaaS();
