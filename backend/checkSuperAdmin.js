import mysql from 'mysql2/promise';

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'pg_management'
  });
  
  const [users] = await connection.query("SELECT u.id, u.email, u.password_hash, r.name as role FROM users u JOIN roles r ON u.role_id = r.id");
  console.log(users);
  
  process.exit(0);
}
check();
