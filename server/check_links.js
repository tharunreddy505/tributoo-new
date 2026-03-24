import pool from './db.js';

async function checkTributeLinks() {
    try {
        const res = await pool.query('SELECT id, name, video_urls FROM tributes WHERE id = $1', [17]);
        console.log('Tribute 17 Links:', JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTributeLinks();
