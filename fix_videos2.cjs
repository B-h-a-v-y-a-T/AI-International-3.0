const fs = require('fs');

const srcPath = 'c:/Users/bhavy/Downloads/itsahack2.0-integration1/itsahack2.0-integration1/videos.html';
const targetPath = 'c:/Users/bhavy/Downloads/itsahack2.0-integration1 (1)/itsahack2.0-p/videos.html';

// Read from source to get a fresh copy
let html = fs.readFileSync(srcPath, 'utf8');

// The main issue is HTML entities being incorrectly interpreted inside the <script> block.
const regex = /<script.*?>([\s\S]*?)<\/script>/gi;
html = html.replace(regex, (match, code) => {
    // Only unescape operators!
    let fixed = code
        .replace(/&amp;&amp;/g, '&&')         // Logical AND
        .replace(/=&gt;/g, '=>')             // Arrow function
        .replace(/&lt;/g, '<')               // Less than
        .replace(/&gt;/g, '>')               // Greater than
        // Do NOT replace &quot; or &#39; directly into single/double quotes, 
        // but we CAN fix the ones that got double escaped like &amp;#39; -> &#39;
        .replace(/&amp;#39;/g, '&#39;')
        .replace(/&amp;quot;/g, '&quot;');
    
    // Check if match contains src attribute
    if (match.includes('src=')) {
        return match; // Don't modify external tags
    }
    return '<script>\n' + fixed + '\n</script>';
});

// Update the target backend ports
html = html.replace(/5000/g, '5050').replace(/8080/g, '8050');

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Fixed videos.html logic operators, ports, and replaced with fresh contents!');