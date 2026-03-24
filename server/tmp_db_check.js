import db from './db.js';
import fs from 'fs';
async function run() {
    const subRes = await db.query("SELECT s.*, p.name as product_name FROM subscriptions s LEFT JOIN products p ON s.product_id = p.id WHERE s.id = 71 OR s.memorial_name LIKE '%hkn%'");
    const tribRes = await db.query("SELECT id, name, user_id, slug FROM tributes WHERE name LIKE '%hkn%'");
    fs.writeFileSync('db_check.json', JSON.stringify({
        subscriptions: subRes.rows,
        tributes: tribRes.rows
    }, null, 2));
    process.exit(0);
}
run();
