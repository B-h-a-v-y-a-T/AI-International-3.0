const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'videos.html');
let html = fs.readFileSync(targetFile, 'utf8');

// Fix HTML entities in script blocks
html = html.replace(/<script>([\s\S]*?)<\/script>/gi, (match, code) => {
    if (match.includes('src=')) return match;
    const fixed = code
        .replace(/&amp;&amp;/g, '&&')
        .replace(/=&gt;/g, '=>')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    return '<script>' + fixed + '</script>';
});

// Fix ports
html = html.replace(/localhost:5000/g, 'localhost:5050');
html = html.replace(/localhost:8080/g, 'localhost:8050');

fs.writeFileSync(targetFile, html, 'utf8');
console.log('Applied port fixes and HTML entity unescaping to videos.html');
