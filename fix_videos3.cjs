const fs = require('fs');

const srcPath = 'c:/Users/bhavy/Downloads/itsahack2.0-integration1/itsahack2.0-integration1/videos.html';
const targetPath = 'c:/Users/bhavy/Downloads/itsahack2.0-integration1 (1)/itsahack2.0-p/videos.html';

let html = fs.readFileSync(srcPath, 'utf8');

// Just split by <script> and </script> to manually unescape each script body.
const parts = html.split(/(<script.*?>|<\/script>)/i);

for (let i = 0; i < parts.length; i++) {
    const p = parts[i].toLowerCase();
    if (p.startsWith('<script') && !p.includes('src=')) {
        // The next item in parts array should ideally be the JS code
        let code = parts[i + 1];
        
        // Let's do string replaces one by one carefully
        code = code.split('&amp;&amp;').join('&&');
        code = code.split('=&gt;').join('=>');
        code = code.split('&lt;').join('<');
        code = code.split('&gt;').join('>');
        // Crucially, revert ONLY exactly what was escaped wrongly.
        // We know that inside template strings, they had HTML string escapes.
        // We DO NOT want to replace &amp;#39; with ' because they put &amp;#39; to represent ' in the generated HTML.
        // Wait, if the source code generated: `<button data="${name}">`
        // Then what was originally written was `title.replace(/'/g, "&#39;")`
        // But markdown parsing broke it to `title.replace(/'/g, "&amp;#39;")`.
        code = code.split('&amp;#39;').join('&#39;');
        code = code.split('&amp;quot;').join('&quot;');

        parts[i + 1] = code;
    }
}

let finalHtml = parts.join('');

// Fix the backend API port 
finalHtml = finalHtml.replace(/5000/g, '5050').replace(/8080/g, '8050');

fs.writeFileSync(targetPath, finalHtml, 'utf8');

console.log('Processed videos.html manually block by block.');
