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
    // ── English ──────────────────────────────────────────────────────────────
    {
        language: 'en',
        name: 'Welcome — Registration Confirmation',
        subject: 'Welcome to Tributoo – Your account is ready 🎉',
        body: `
<p>Hello [user_name],</p>

<p>Great to have you here. Thank you for choosing <strong>Tributoo</strong> — a platform that keeps memories alive and brings people together.</p>

<p>Your account has been successfully created with the following details:</p>

<table style="border-collapse:collapse; margin: 16px 0;">
  <tr>
    <td style="padding: 6px 16px 6px 0; color:#666; font-size:14px;">Username:</td>
    <td style="padding: 6px 0; font-weight:bold; font-size:14px;">[user_name]</td>
  </tr>
  <tr>
    <td style="padding: 6px 16px 6px 0; color:#666; font-size:14px;">Email:</td>
    <td style="padding: 6px 0; font-weight:bold; font-size:14px;">[user_email]</td>
  </tr>
</table>

<p>You can access your personal account, share memories, view orders, or change your password using the link below:</p>

<p style="margin: 25px 0;">
  <a href="[account_link]"
     style="background-color:#c59d5f; color:#000; padding:14px 30px;
            text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px;">
    Go to My Account
  </a>
</p>

<p>If you have any questions or need support, we are always here for you. We look forward to accompanying you on this special journey.</p>

<p>Sincerely,<br><strong>Your Tributoo Team</strong></p>
        `
    },
    // ── German ───────────────────────────────────────────────────────────────
    {
        language: 'de',
        name: 'Willkommen — Registrierungsbestätigung',
        subject: 'Willkommen bei Tributoo – Ihr Konto ist bereit 🎉',
        body: `
<p>Hallo [user_name],</p>

<p>Schön, dass Sie hier sind. Vielen Dank, dass Sie sich für <strong>Tributoo</strong> entschieden haben — eine Plattform, die Erinnerungen lebendig hält und Menschen verbindet.</p>

<p>Ihr Konto wurde erfolgreich mit folgenden Daten erstellt:</p>

<table style="border-collapse:collapse; margin: 16px 0;">
  <tr>
    <td style="padding: 6px 16px 6px 0; color:#666; font-size:14px;">Benutzername:</td>
    <td style="padding: 6px 0; font-weight:bold; font-size:14px;">[user_name]</td>
  </tr>
  <tr>
    <td style="padding: 6px 16px 6px 0; color:#666; font-size:14px;">E-Mail:</td>
    <td style="padding: 6px 0; font-weight:bold; font-size:14px;">[user_email]</td>
  </tr>
</table>

<p>Sie können Ihr persönliches Konto aufrufen, Erinnerungen teilen, Bestellungen einsehen oder Ihr Passwort über den folgenden Link ändern:</p>

<p style="margin: 25px 0;">
  <a href="[account_link]"
     style="background-color:#c59d5f; color:#000; padding:14px 30px;
            text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px;">
    Zu meinem Konto
  </a>
</p>

<p>Wenn Sie Fragen haben oder Unterstützung benötigen, sind wir immer für Sie da. Wir freuen uns, Sie auf dieser besonderen Reise begleiten zu dürfen.</p>

<p>Mit freundlichen Grüßen,<br><strong>Ihr Tributoo-Team</strong></p>
        `
    },
    // ── Italian ──────────────────────────────────────────────────────────────
    {
        language: 'it',
        name: 'Benvenuto — Conferma di Registrazione',
        subject: 'Benvenuto su Tributoo – Il tuo account è pronto 🎉',
        body: `
<p>Ciao [user_name],</p>

<p>Siamo felici di averti qui. Grazie per aver scelto <strong>Tributoo</strong> — una piattaforma che mantiene vivi i ricordi e unisce le persone.</p>

<p>Il tuo account è stato creato con successo con i seguenti dati:</p>

<table style="border-collapse:collapse; margin: 16px 0;">
  <tr>
    <td style="padding: 6px 16px 6px 0; color:#666; font-size:14px;">Nome utente:</td>
    <td style="padding: 6px 0; font-weight:bold; font-size:14px;">[user_name]</td>
  </tr>
  <tr>
    <td style="padding: 6px 16px 6px 0; color:#666; font-size:14px;">Email:</td>
    <td style="padding: 6px 0; font-weight:bold; font-size:14px;">[user_email]</td>
  </tr>
</table>

<p>Puoi accedere al tuo account personale, condividere ricordi, visualizzare gli ordini o cambiare la password tramite il seguente link:</p>

<p style="margin: 25px 0;">
  <a href="[account_link]"
     style="background-color:#c59d5f; color:#000; padding:14px 30px;
            text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px;">
    Vai al mio account
  </a>
</p>

<p>Se hai domande o hai bisogno di supporto, siamo sempre qui per te. Non vediamo l'ora di accompagnarti in questo viaggio speciale.</p>

<p>Cordiali saluti,<br><strong>Il tuo Team Tributoo</strong></p>
        `
    }
];

async function run() {
    // Remove old version if re-running
    await pool.query(`DELETE FROM email_templates WHERE slug = 'user_registration'`);
    console.log('🗑️  Removed old user_registration templates (if any)');

    for (const row of templates) {
        await pool.query(
            `INSERT INTO email_templates
             (slug, name, subject, body, language, header_enabled, footer_enabled,
              timing_type, timing_delay_value, timing_delay_unit, timing_reference)
             VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, 'immediate', 0, 'days', 'registration')`,
            ['user_registration', row.name, row.subject, row.body, row.language]
        );
        console.log(`✅ Inserted user_registration [${row.language}] — "${row.subject}"`);
    }

    console.log('\n📧 Registration email template inserted successfully!');
    console.log('   Slug: user_registration');
    console.log('   Shortcodes: [user_name], [user_email], [account_link]');
    await pool.end();
    process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
