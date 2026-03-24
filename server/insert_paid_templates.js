import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'tributto',
    password: process.env.DB_PASSWORD || '5432',
    port: process.env.DB_PORT || 5432
});

const templates = [
    {
        slug: 'premium_memorial_creation',
        language: 'en',
        name: 'Premium Memorial Created',
        subject: 'Premium Memorial Created: [memorial_name] is Now Live',
        body: '<p>Hello [user_name],</p><p>Congratulations! Your <strong>Premium Memorial Page</strong> for <strong>[memorial_name]</strong> has been successfully created and is now live on Tributoo.</p><p>As a Premium member, your memorial page will remain active for <strong>lifetime</strong>, and you have access to all high-end features including unlimited photo uploads, video support, and more.</p><p style="margin: 25px 0;"><a href="[memorial_link]" style="background-color: #c59d5f; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">View Memorial Page</a></p><p>Thank you for choosing Tributoo to preserve these precious memories.</p><p>Best regards,<br/>The Tributoo Team</p>'
    },
    {
        slug: 'corporate_memorial_creation',
        language: 'en',
        name: 'Corporate Memorial Created',
        subject: 'Corporate Memorial Created: [memorial_name] is Now Live',
        body: '<p>Hello [user_name],</p><p>Congratulations! Your <strong>Corporate Memorial Page</strong> for <strong>[memorial_name]</strong> has been successfully created and is now live on Tributoo.</p><p>As a Corporate member, this page will remain active for <strong>lifetime</strong>, and you have access to our full suite of memorial and legacy management tools.</p><p style="margin: 25px 0;"><a href="[memorial_link]" style="background-color: #c59d5f; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">View Memorial Page</a></p><p>Thank you for choosing Tributoo to build this lasting legacy.</p><p>Best regards,<br/>The Tributoo Team</p>'
    }
];

async function run() {
    try {
        for (const t of templates) {
            console.log("Inserting/Updating template: " + t.slug + " (" + t.language + ")");
            await pool.query(
                "INSERT INTO email_templates (slug, language, name, subject, body, shortcodes, header_enabled, footer_enabled) " +
                "VALUES ($1, $2, $3, $4, $5, $6, $7, $8) " +
                "ON CONFLICT (slug, language) DO UPDATE " +
                "SET name = EXCLUDED.name, subject = EXCLUDED.subject, body = EXCLUDED.body, updated_at = CURRENT_TIMESTAMP",
                [t.slug, t.language, t.name, t.subject, t.body, JSON.stringify([]), true, true]
            );
        }
        console.log('✅ Templates for Premium and Corporate memorials inserted successfully.');
    } catch (err) {
        console.error('❌ Error inserting templates:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();
