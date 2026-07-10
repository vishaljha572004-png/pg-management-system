import pool from './src/config/db.js';
pool.execute("SELECT billing_month, SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_collected, SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending FROM rent_payments GROUP BY billing_month ORDER BY MIN(id) ASC LIMIT 12").then(res => {
  console.log(res[0]);
  process.exit(0);
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
