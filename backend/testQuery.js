import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const run = async () => {
  try {
    const pool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pg_management',
    });

    const [rows] = await pool.execute("SELECT id FROM users WHERE role = 'student' LIMIT 1");
    if (rows.length === 0) {
       console.log("No student found");
       process.exit(0);
    }
    const studentId = rows[0].id;
    console.log("Deleting student:", studentId);
    
    await pool.execute("DELETE FROM users WHERE id = ?", [studentId]);

    console.log("Deleted successfully");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
run();
