import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function check() {
    try {
        const countRes = await pool.query("SELECT COUNT(*) FROM tributes WHERE is_anniversary_reminder = 'yes'");
        console.log("Count of tributes with reminders:", countRes.rows[0].count);

        const sampleRes = await pool.query("SELECT id, name, reminder_options FROM tributes WHERE is_anniversary_reminder = 'yes' LIMIT 5");
        console.log("Samples:", JSON.stringify(sampleRes.rows, null, 2));

        const schemaRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tributes'");
        console.log("Schema:", JSON.stringify(schemaRes.rows, null, 2));

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

check();
