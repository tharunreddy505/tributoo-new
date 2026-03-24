import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({
    user: process.env.DB_USER, host: process.env.DB_HOST,
    database: process.env.DB_NAME, password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432
});

const templates = [
    {
        language: 'en',
        name: 'Password Reset',
        subject: 'Reset your Tributoo password',
        body: `
<p>Hi [user_name],</p>

<p>We received a password reset request for your account at <strong>Tributoo — Online Memorial Page</strong>.</p>

<p>If you did not request this, you can safely ignore this email.</p>

<p>If you'd like to proceed, click the button below to reset your password:</p>

<p style="margin: 28px 0;">
  <a href="[reset_link]"
     style="background-color:#c59d5f; color:#000; padding:14px 32px;
            text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px;">
    Reset My Password
  </a>
</p>

<p style="font-size:13px; color:#666;">Or copy and paste this link into your browser:<br>
<a href="[reset_link]" style="color:#c59d5f;">[reset_link]</a></p>

<p><strong>This link is valid for 24 hours.</strong> After that, you'll need to request a new one.</p>

<p>Thanks,<br><strong>The Tributoo Team</strong></p>
        `
    },
    {
        language: 'de',
        name: 'Passwort zurücksetzen',
        subject: 'Setzen Sie Ihr Tributoo-Passwort zurück',
        body: `
<p>Hallo [user_name],</p>

<p>Wir haben eine Anfrage zum Zurücksetzen des Passworts für Ihr Konto bei <strong>Tributoo — Online-Gedenkseite</strong> erhalten.</p>

<p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail einfach ignorieren.</p>

<p>Wenn Sie fortfahren möchten, klicken Sie auf den folgenden Button:</p>

<p style="margin: 28px 0;">
  <a href="[reset_link]"
     style="background-color:#c59d5f; color:#000; padding:14px 32px;
            text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px;">
    Passwort zurücksetzen
  </a>
</p>

<p style="font-size:13px; color:#666;">Oder kopieren Sie diesen Link in Ihren Browser:<br>
<a href="[reset_link]" style="color:#c59d5f;">[reset_link]</a></p>

<p><strong>Dieser Link ist 24 Stunden gültig.</strong></p>

<p>Danke,<br><strong>Ihr Tributoo-Team</strong></p>
        `
    },
    {
        language: 'it',
        name: 'Reimpostazione password',
        subject: 'Reimposta la tua password Tributoo',
        body: `
<p>Ciao [user_name],</p>

<p>Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account su <strong>Tributoo — Pagina Memoriale Online</strong>.</p>

<p>Se non hai fatto questa richiesta, puoi tranquillamente ignorare questa email.</p>

<p>Se desideri procedere, clicca sul pulsante qui sotto per reimpostare la tua password:</p>

<p style="margin: 28px 0;">
  <a href="[reset_link]"
     style="background-color:#c59d5f; color:#000; padding:14px 32px;
            text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px;">
    Reimposta la mia password
  </a>
</p>

<p style="font-size:13px; color:#666;">Oppure copia e incolla questo link nel tuo browser:<br>
<a href="[reset_link]" style="color:#c59d5f;">[reset_link]</a></p>

<p><strong>Questo link è valido per 24 ore.</strong></p>

<p>Grazie,<br><strong>Il Team Tributoo</strong></p>
        `
    }
];

async function run() {
    await pool.query(`DELETE FROM email_templates WHERE slug = 'password_reset'`);
    console.log('🗑️  Removed old password_reset templates (if any)');

    for (const row of templates) {
        await pool.query(
            `INSERT INTO email_templates
             (slug, name, subject, body, language, header_enabled, footer_enabled,
              timing_type, timing_delay_value, timing_delay_unit, timing_reference)
             VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, 'immediate', 0, 'days', 'trigger')`,
            ['password_reset', row.name, row.subject, row.body, row.language]
        );
        console.log(`✅ Inserted password_reset [${row.language}] — "${row.subject}"`);
    }

    console.log('\n📧 Password reset email template ready!');
    console.log('   Slug: password_reset');
    console.log('   Shortcodes: [user_name], [reset_link]');
    console.log('   Link expires: 24 hours');
    await pool.end();
    process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
