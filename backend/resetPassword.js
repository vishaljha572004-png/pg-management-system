import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

async function resetPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'pg_management'
  });
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('superadmin123', salt);
  
  await connection.query("UPDATE users SET password_hash = ? WHERE email = 'superadmin@pg.com'", [hash]);
  
  console.log('Password reset successfully to superadmin123');
  process.exit();
}
resetPassword();
