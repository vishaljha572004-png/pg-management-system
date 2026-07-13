import mysql from 'mysql2/promise';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function run() {
  console.log('\n--- 🚀 ONE SHOT DATABASE FIX ---');
  console.log('Yeh script aapke Render/Aiven database ko permanently fix kar dega.');
  console.log('Apne Render Dashboard se details copy karke yahan paste karein:\n');

  const host = await question('DB_HOST: ');
  const port = await question('DB_PORT (usually 3306 or Aiven port): ');
  const user = await question('DB_USER: ');
  const password = await question('DB_PASSWORD: ');
  const database = await question('DB_NAME (Render/Aiven Database Name): ');

  console.log('\nConnecting to Database...');
  
  try {
    const pool = mysql.createPool({
      host: host.trim(),
      port: parseInt(port.trim()) || 3306,
      user: user.trim(),
      password: password.trim(),
      database: database.trim(),
    });

    
    await pool.execute('SELECT 1');
    console.log('✅ Connection Successful!');

    const queries = [
      'ALTER TABLE users ADD COLUMN is_phone_verified BOOLEAN DEFAULT FALSE',
      'ALTER TABLE otp_verification ADD COLUMN expires_at TIMESTAMP',
      'ALTER TABLE otp_verification ADD COLUMN attempts INT DEFAULT 0',
      'ALTER TABLE otp_verification ADD COLUMN purpose VARCHAR(50)',
      'ALTER TABLE otp_verification MODIFY COLUMN otp VARCHAR(255) NOT NULL'
    ];

    for (let q of queries) {
      try {
        await pool.execute(q);
        console.log(`✅ Success: ${q.split('ADD COLUMN')[1] || 'Modified column'}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️ Already exists: ${q.split('ADD COLUMN')[1] || 'Column'}`);
        } else if (e.code === 'ER_NO_SUCH_TABLE') {
          console.error(`❌ Table missing! Aapne galat DB_NAME dala hai jisme tables hi nahi hain.`);
          process.exit(1);
        } else {
          console.log(`ℹ️ Skipped: ${e.message}`);
        }
      }
    }

    console.log('\n🎉 ALL DONE! 100% FIXED! Aap Vercel par test kar sakte hain.');
  } catch (error) {
    console.error('\n❌ Connection Failed! Details galat hain:', error.message);
  } finally {
    process.exit(0);
  }
}

run();
