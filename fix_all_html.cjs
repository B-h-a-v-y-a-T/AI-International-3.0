const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/bhavy/Downloads/itsahack2.0-integration1/itsahack2.0-integration1';
const tgtDir = 'c:/Users/bhavy/Downloads/itsahack2.0-integration1 (1)/itsahack2.0-p';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (['node_modules', '.git', 'backend', 'server'].includes(file)) return;
        const fp = path.join(dir, file);
        if (fs.statSync(fp).isDirectory()) {
            results = results.concat(walk(fp));
        } else if (file.endsWith('.html')) {
            results.push(fp);
        }
    });
    return results;
}

const htmlFiles = walk(srcDir);

htmlFiles.forEach(srcPath => {
    let html = fs.readFileSync(srcPath, 'utf8');
    const rel = path.relative(srcDir, srcPath);
    const tgtPath = path.join(tgtDir, rel);

    try {
        const parts = html.split(/(<script.*?>|<\/script>)/i);
        for (let i = 0; i < parts.length; i++) {
            const p = parts[i].toLowerCase();
            if (p.startsWith('<script') && !p.includes('src=')) {
                let code = parts[i+1];
                if (!code) continue;
                
                code = code.split('&amp;&amp;').join('&&');
                code = code.split('=&gt;').join('=>');
                code = code.split('&lt;').join('<');
                code = code.split('&gt;').join('>');
                code = code.split('&amp;#39;').join('&#39;');
                code = code.split('&amp;quot;').join('&quot;');
                code = code.split('&amp;').join('&'); // any remaining &amp;

                parts[i+1] = code;
            }
        }

        let finalHtml = parts.join('');
        finalHtml = finalHtml.replace(/5000/g, '5050').replace(/8080/g, '8050');
        
        // Ensure tgt directory exists
        const tDir = path.dirname(tgtPath);
        if (!fs.existsSync(tDir)) {
            fs.mkdirSync(tDir, {recursive: true});
        }
        
        fs.writeFileSync(tgtPath, finalHtml, 'utf8');
        console.log('Fixed syntax in', rel);
    } catch (e) {
        console.error('Error processing', srcPath, e);
    }
});
