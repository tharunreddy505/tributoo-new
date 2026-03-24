import pool from './db.js';

async function checkCols() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tributes'");
    console.log(res.rows.map(r => r.column_name).join(', '));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCols();
