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
            // Remove BOM if present (causes syntax error in mysql2)
            if (sql.charCodeAt(0) === 0xFEFF) {
                sql = sql.slice(1);
            }
            // Remove comments that might cause issues with multipleStatements
            sql = sql.replace(/^--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
            await connection.query(sql);
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
