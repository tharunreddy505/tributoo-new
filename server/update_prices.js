import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD),
    port: process.env.DB_PORT,
});

async function updateProducts() {
    try {
        console.log('Updating products...');
        
        // Update Premium products
        await pool.query(`
            UPDATE products 
            SET price = 58.00, name = 'PREMIUM', description = 'Lifetime memorial'
            WHERE name ILIKE '%premium%' 
               OR name ILIKE '%lifetime%' 
               OR name ILIKE '%permanent%'
        `);
        console.log('Premium products updated.');

        // Update or Insert Free product
        const freeCheck = await pool.query("SELECT id FROM products WHERE name ILIKE '%free%'");
        if (freeCheck.rows.length > 0) {
            await pool.query(`
                UPDATE products 
                SET price = 0.00, name = 'FREE', description = '10 years memorial'
                WHERE name ILIKE '%free%'
            `);
        } else {
            await pool.query(`
                INSERT INTO products (name, description, price, category)
                VALUES ('FREE', '10 years memorial', 0.00, 'subscription')
            `);
        }
        console.log('Free product updated/inserted.');

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
