import pool from './db.js';
async function run() {
  try {
    const res = await pool.query("SELECT name FROM products");
    console.log(res.rows.map(r => r.name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
