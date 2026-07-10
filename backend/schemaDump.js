import pool from './src/config/db.js';

const run = async () => {
  try {
    const [tables] = await pool.execute("SHOW TABLES");
    console.log("Tables:");
    console.log(tables);

    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      const [columns] = await pool.execute(`SHOW COLUMNS FROM ${tableName}`);
      console.log(`\nTable: ${tableName}`);
      columns.forEach(col => console.log(`  ${col.Field} - ${col.Type}`));
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
run();
