import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({ user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT || 5432 });

// Check tributes columns
const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='tributes' ORDER BY ordinal_position");
console.log('Tributes columns:', r.rows.map(x => x.column_name).join(', '));

// Test full author query
try {
    const userRes = await pool.query("SELECT id FROM users WHERE username = $1", ['babu']);
    const userId = userRes.rows[0].id;
    const t = await pool.query(
        `SELECT t.id, t.name, t.slug, t.photo, t.birth_date, t.passing_date, t.created_at,
                t.status, t.images,
                s.status as subscription_status, s.is_lifetime, s.trial_end, s.paid_end
         FROM tributes t
         LEFT JOIN subscriptions s ON t.id = s.memorial_id
         WHERE t.user_id = $1
           AND (t.status = 'public' OR t.status IS NULL)
         ORDER BY t.created_at DESC`,
        [userId]
    );
    console.log('Tributes query OK, rows:', t.rows.length);
} catch (e) {
    console.error('Tributes query ERROR:', e.message);
}
await pool.end();
