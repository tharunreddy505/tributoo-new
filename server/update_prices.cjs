const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateProducts() {
    try {
        console.log('Updating products...');
        
        // Update Free product
        await pool.query(`
            UPDATE products 
            SET price = 0.00, name = 'FREE', description = '10 years memorial'
            WHERE name ILIKE '%free%'
        `);
        console.log('Free product updated.');

        // Update Premium product
        await pool.query(`
            UPDATE products 
            SET price = 58.00, name = 'PREMIUM', description = 'Lifetime memorial'
            WHERE name ILIKE '%premium%'
        `);
        console.log('Premium product updated.');

        // Verify updates
        const res = await pool.query('SELECT name, price FROM products');
        console.log('Current products:', res.rows);

    } catch (err) {
        console.error('Update error:', err);
    } finally {
        await pool.end();
    }
}

updateProducts();
