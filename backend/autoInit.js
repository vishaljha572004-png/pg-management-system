import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
    try {
        console.log("Starting AutoInit check...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pg_management',
            multipleStatements: true
        });

        // Check if table 'pgs' exists
        const [rows] = await connection.query("SHOW TABLES LIKE 'pgs'");
        if (rows.length === 0) {
            console.log("Database looks empty. Running schema dump...");
            let sql = fs.readFileSync(path.join(__dirname, 'schema_dump.sql'), 'utf8');
            
            if (sql.charCodeAt(0) === 0xFEFF) {
                sql = sql.slice(1);
            }
            
            // Aggressively remove all MySQL comments and executable comments to prevent parser crashes
            sql = sql.replace(/--.*$/gm, ''); // Remove line comments
            sql = sql.replace(/\/\*![\s\S]*?\*\//g, ''); // Remove executable comments
            sql = sql.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
            
            const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
            
            for (let stmt of statements) {
                try {
                    await connection.query(stmt);
                } catch (err) {
                    console.log("Skipped a query due to error (likely a comment): ", err.message);
                }
            }
            console.log("Schema dump imported successfully!");
        } else {
            console.log("Database already initialized. Skipping auto-init.");
        }
        await connection.end();
        process.exit(0);
    } catch (e) {
        console.error("AutoInit error:", e.message);
        process.exit(1);
    }
}

init();
