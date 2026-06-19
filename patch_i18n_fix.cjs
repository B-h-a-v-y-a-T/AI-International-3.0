const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'i18n.js');
let content = fs.readFileSync(file, 'utf8');

const regex = /'nav\.daily_quiz': \{ en: 'Daily Quiz',([\s\S]*?)'nav\.revision': \{ en: 'Revision Notes'(.*?)\},([\s\S]*?)\},/g;

content = content.replace(regex, (match, prefix, revInside, dailyInside) => {
    return `'nav.daily_quiz': { en: 'Daily Quiz',${dailyInside} },\n    'nav.revision': { en: 'Revision Notes'${revInside} },`;
});

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed i18n object');
