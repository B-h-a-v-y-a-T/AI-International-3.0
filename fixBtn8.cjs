const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'videos.html');
let c = fs.readFileSync(targetFile, 'utf8');

c = c.replace(/=&gt;/g, '=>');
c = c.replace(/&amp;&amp;/g, '&&');
c = c.replace(/localhost:5000/g, 'localhost:5050');
c = c.replace(/localhost:8080/g, 'localhost:8050');

fs.writeFileSync(targetFile, c, 'utf8');
console.log('Final cleanup done. Size:', c.length);
