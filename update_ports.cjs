const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        if (['node_modules', '.git', '__pycache__', 'edtech.db'].includes(file)) return;
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filepath));
        } else {
            results.push(filepath);
        }
    });
    return results;
}

const targetExts = ['.html', '.css', '.js', '.cjs', '.py', '.bat', '.md', '.json', '.env.example'];

const files = walk(__dirname);
let count = 0;
files.forEach(f => {
    const ext = path.extname(f);
    if (!targetExts.includes(ext) && f !== path.join(__dirname, '.env.example') && f !== path.join(__dirname, 'server', 'index.js')) return;

    try {
        const text = fs.readFileSync(f, 'utf8');
        if (text.includes('5050') || text.includes('8050')) {
            const newText = text.replace(/5050/g, '5050').replace(/8050/g, '8050');
            fs.writeFileSync(f, newText, 'utf8');
            console.log(`Updated ports in ${path.relative(__dirname, f)}`);
            count++;
        }
    } catch(e) {}
});

console.log(`Port update script finished. Updated ${count} files.`);