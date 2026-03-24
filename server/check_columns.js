import db from './db.js';
import fs from 'fs';
async function run() {
    try {
        const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tributes'");
        fs.writeFileSync('tributes_columns.json', JSON.stringify(res.rows, null, 2));
    } catch (e) {
        fs.writeFileSync('db_error.txt', e.message);
    }
    process.exit(0);
}
run();
