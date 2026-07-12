const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function createAccounts() {
  const base_url = 'http://localhost:5000/api';
  const secret = process.env.JWT_SECRET || 'super_secret_access_key_2026';
  
  // 1. Create Admin
  const adminPhone = '9999900001';
  const adminEmail = 'admin1@control.com';
  const adminPassword = 'Password123';
  
  const adminOtp = jwt.sign({ phone: adminPhone, purpose: 'admin_signup', verified: true }, secret);
  
  let orgCode = null;
  try {
    const res = await axios.post(base_url + '/auth/register-pg', {
      pg_name: 'Control Test PG',
      owner_name: 'Control Admin',
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword,
      otpToken: adminOtp
    });
    console.log('✅ Admin Created successfully.');
    
    // Fetch org code from DB directly for testing
    const mysql = require('mysql2/promise');
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: process.env.DB_PASSWORD || '12345', database: 'pg_management' });
    const [pgs] = await pool.execute('SELECT org_code FROM pgs ORDER BY id DESC LIMIT 1');
    orgCode = pgs[0].org_code;
    await pool.end();
    console.log('   PG Org Code:', orgCode);
    
    // Test Admin Login
    await axios.post(base_url + '/auth/admin/login', { email: adminEmail, password: adminPassword });
    console.log('✅ Admin Login test: SUCCESS');
    
  } catch(e) {
    if (e.response?.data?.message === 'User with this email or phone already exists') {
        console.log('✅ Admin already exists.');
        const mysql = require('mysql2/promise');
        const pool = mysql.createPool({ host: 'localhost', user: 'root', password: process.env.DB_PASSWORD || '12345', database: 'pg_management' });
        const [pgs] = await pool.execute('SELECT org_code FROM pgs ORDER BY id DESC LIMIT 1');
        orgCode = pgs[0].org_code;
        await pool.end();
    } else {
        console.log('❌ Admin Create/Login Failed:', e.response?.data || e.message);
    }
  }

  // 2. Create Student
  if (!orgCode) return;
  
  const studentPhone = '9999900002';
  const studentEmail = 'student1@control.com';
  const studentPassword = 'Password123';
  
  const studentOtp = jwt.sign({ phone: studentPhone, purpose: 'student_signup', verified: true }, secret);
  
  try {
    const res = await axios.post(base_url + '/auth/register', {
      name: 'Control Student',
      email: studentEmail,
      phone: studentPhone,
      password: studentPassword,
      org_code: orgCode,
      otpToken: studentOtp
    });
    console.log('✅ Student Created successfully.');
    
    // Test Student Login
    await axios.post(base_url + '/auth/login', { email: studentEmail, password: studentPassword });
    console.log('✅ Student Login test: SUCCESS');
  } catch(e) {
    if (e.response?.data?.message === 'User with this email or phone already exists') {
        console.log('✅ Student already exists.');
    } else {
        console.log('❌ Student Create/Login Failed:', e.response?.data || e.message);
    }
  }
}
createAccounts();
