const fs = require('fs');
const lines = fs.readFileSync('chat.html', 'utf8').split('\n');
console.log(lines.filter(l => l.includes('function')).slice(0, 10).join('\n'));
