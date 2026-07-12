const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function traceLogin(email, password, role) {
  console.log(`\n=== TRACING LOGIN FOR ${email} as ${role} ===`);
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: process.env.DB_PASSWORD || '12345', database: 'pg_management' });
  
  try {
    const [usersByEmail] = await pool.execute('SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?', [email]);
    console.log(`1. User found by email: ${usersByEmail.length > 0}`);
    
    let user = usersByEmail[0];
    if (!user) {
      const [usersByPhone] = await pool.execute('SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.phone = ?', [email]);
      console.log(`2. User found by phone: ${usersByPhone.length > 0}`);
      user = usersByPhone[0];
    }
    
    if (!user) {
      console.log('RESULT: USER_NOT_FOUND');
      return;
    }
    
    console.log(`3. Stored password hash exists: ${!!user.password_hash}`);
    if (!user.password_hash) {
      console.log('RESULT: PASSWORD_HASH_MISSING');
      return;
    }
    
    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log(`4. bcrypt comparison result: ${isMatch}`);
    
    if (!isMatch) {
      console.log('RESULT: PASSWORD_COMPARE_FAILED');
      return;
    }
    
    const normalizedAllowedRoles = [role].map(r => r.toLowerCase());
    const roleMatch = user.role && normalizedAllowedRoles.includes(user.role.toLowerCase());
    console.log(`5. Role mismatch: expected ${role}, got ${user.role} -> ${roleMatch}`);
    
    if (!roleMatch) {
      console.log('RESULT: ROLE_MISMATCH');
      return;
    }
    
    console.log('RESULT: SUCCESS');
    
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    pool.end();
  }
}

async function main() {
  await traceLogin('vishal0507@gmail.com', '12345678', 'Student');
  await traceLogin('vishal05@gmail.com', 'vishal05', 'Admin'); // Guessing password from previous turns
}
main();
