import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let poolConfig = {};

if (process.env.DATABASE_URL || process.env.DB_URI) {
  // Support standard connection strings from Render/Aiven/PlanetScale
  poolConfig = {
    uri: process.env.DATABASE_URL || process.env.DB_URI,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pg_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

// Cloud MySQL databases strictly require SSL in production
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Successfully connected to the MySQL database.');
    
    // Auto-patch missing columns to prevent 500 errors in production
    connection.query('ALTER TABLE users ADD COLUMN refresh_token TEXT NULL')
      .then(() => console.log('✅ Auto-patched: Added refresh_token to users table.'))
      .catch(e => {
        if (e.code !== 'ER_DUP_FIELDNAME') {
          console.error('Auto-patch error (refresh_token):', e.message);
        }
      });
      
    connection.release();
  })
  .catch(error => {
    console.error('❌ Error connecting to the MySQL database:', error.message);
  });

export default pool;
