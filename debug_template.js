import pool from './server/db.js';
async function run() {
    try {
        const r = await pool.query("SELECT slug, body FROM email_templates WHERE slug = 'trial_5_days_reminder'");
        console.log(JSON.stringify(r.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
