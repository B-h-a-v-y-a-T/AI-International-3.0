const fs = require('fs');
const filepath = 'videos.html';
let html = fs.readFileSync(filepath, 'utf8');

const regex = /<script>([\s\S]*?)<\/script>/gi;
html = html.replace(regex, (match, p1) => {
    let unescaped = p1
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/=&gt;/g, '=>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"');
    return '<script>' + unescaped + '</script>';
});

fs.writeFileSync(filepath, html, 'utf8');
console.log('Unescaped script in videos.html');