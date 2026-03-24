import db from './db.js';
import fs from 'fs';
async function run() {
    const res = await db.query("SELECT * FROM email_logs WHERE template_slug = 'anniversary_reminder' ORDER BY sent_at DESC LIMIT 10");
    fs.writeFileSync('email_logs_check.json', JSON.stringify(res.rows, null, 2));
    process.exit(0);
}
run();
