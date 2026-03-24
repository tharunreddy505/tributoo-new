import pool from './server/db.js';

async function run() {
    try {
        console.log('Cleaning up email templates...');
        
        const res = await pool.query("SELECT id, slug, body FROM email_templates");
        
        for (const row of res.rows) {
            let body = row.body;
            let updated = false;

            // If it contains the specific redundant structure
            if (body.includes('background-color: #1d2327') && body.includes('max-width: 600px')) {
                console.log(`Cleaning template: ${row.slug}`);
                
                // Extract only the part inside the white box or the main content
                // We'll look for the part between the header and the individual footer
                const contentMatch = body.match(/<div [^>]*background-color:\s*#fff[^>]*>(.*?)<\/div>/s);
                if (contentMatch) {
                    body = contentMatch[1].trim();
                    updated = true;
                } else {
                    // Fallback: just remove the black header div
                    const headerMatch = body.match(/<div [^>]*background-color:\s*#1d2327[^>]*>.*?<\/div>/s);
                    if (headerMatch) {
                        body = body.replace(headerMatch[0], '').trim();
                        updated = true;
                    }
                }
            }
            
            if (updated) {
                // Ensure we don't have too many closing divs if we did a partial extract
                const divCount = (body.match(/<div/g) || []).length;
                const closeDivCount = (body.match(/<\/div>/g) || []).length;
                if (closeDivCount > divCount) {
                     for (let i = 0; i < (closeDivCount - divCount); i++) {
                        body = body.replace(/<\/div>\s*$/, '');
                    }
                }

                await pool.query("UPDATE email_templates SET body = $1 WHERE id = $2", [body.trim(), row.id]);
                console.log(`✅ Updated: ${row.slug}`);
            }
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
