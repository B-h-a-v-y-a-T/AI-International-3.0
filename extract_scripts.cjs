const fs = require('fs');
const html = fs.readFileSync('c:/Users/bhavy/Downloads/itsahack2.0-integration1 (1)/itsahack2.0-p/videos.html', 'utf8');

const matches = [...html.matchAll(/<script.*?>([\s\S]*?)<\/script>/gi)];
let allScripts = '';
for (let i = 0; i < matches.length; i++) {
    allScripts += `\n/* script block ${i} */\n` + matches[i][1];
}
fs.writeFileSync('temp_scripts.js', allScripts, 'utf8');
console.log('Scripts extracted directly to temp_scripts.js');