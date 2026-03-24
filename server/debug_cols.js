import pool from './db.js';
async function run() {
  try {
    const res = await pool.query("SELECT * FROM information_schema.columns WHERE table_name = 'subscriptions'");
    console.log(res.rows.map(r => r.column_name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
