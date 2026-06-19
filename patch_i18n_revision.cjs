const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'i18n.js');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('nav.revision')) {
    // Add it after nav.daily_quiz
    const strToAdd = `\n  'nav.revision': { en: 'Revision Notes', hi: 'टिप्पणियाँ', mr: 'नोट्स', gu: 'નોંધો' },`;
    content = content.replace(/'nav\.daily_quiz'.*?,/, match => match + strToAdd);
    fs.writeFileSync(file, content, 'utf8');
    console.log('patched i18n.js');
} else {
    console.log('already patched');
}
