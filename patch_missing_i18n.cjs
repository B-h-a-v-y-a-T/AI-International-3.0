const fs = require('fs');
const TRANSLATIONS = require('./i18n_keys.json');
const cheerio = require('cheerio');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    const $ = cheerio.load(html, { decodeEntities: false });
    let changed = false;

    for (const [key, obj] of Object.entries(TRANSLATIONS)) {
        const engText = obj.en;
        
        [placeholder].each((i, el) => {
            if (.attr('placeholder') === engText) {
                .attr('data-i18n-placeholder', key);
                changed = true;
            }
        });

        *.each((i, el) => {
            if (.attr('data-i18n')) return;
            
            const htmlContent = .html() ? .html().trim() : '';
            const textContent = .text().trim();
            
            // Un-escape HTML entities for checking
            const normalizedHtml = htmlContent.replace(/&amp;/g, '&').replace(/\s+/g, ' ');
            const normalizedText = textContent.replace(/\s+/g, ' ');
            const normalizedEng = engText.replace(/\s+/g, ' ');

            if (normalizedHtml === normalizedEng || normalizedText === normalizedEng) {
                .attr('data-i18n', key);
                if (htmlContent.includes('<') || engText.includes('<')) {
                    .attr('data-i18n-html', 'true');
                }
                changed = true;
            }
        });
    }

    if (changed) {
         // cheerio adds html/head/body sometimes, let's just write inner content?
         // By default load(html) modifies the doc structure. 
         // Let's use string replace instead for safety if we found the elements.
         // Actually, cheerio.load without { isDocument: false } will wrap elements.
         // If file has <html> tag, it's fine.
         fs.writeFileSync(file, $.html());
         console.log('Patched', file);
    }
}

