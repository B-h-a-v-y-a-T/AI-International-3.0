const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Cache bust app.js
    if (content.includes('src="app.js"')) {
        content = content.replace(/src="app\.js"/g, 'src="app.js?v=' + Date.now() + '"');
        console.log(`Cache busted app.js in ${file}`);
    } else if (content.match(/src="app\.js\?v=\d+"/)) {
        content = content.replace(/src="app\.js\?v=\d+"/g, 'src="app.js?v=' + Date.now() + '"');
        console.log(`Updated Cache bust app.js in ${file}`);
    }
    
    // Cache bust ai-tutor.css
    if (content.includes('href="ai-tutor.css"')) {
        content = content.replace(/href="ai-tutor\.css"/g, 'href="ai-tutor.css?v=' + Date.now() + '"');
        console.log(`Cache busted ai-tutor.css in ${file}`);
    } else if (content.match(/href="ai-tutor\.css\?v=\d+"/)) {
        content = content.replace(/href="ai-tutor\.css\?v=\d+"/g, 'href="ai-tutor.css?v=' + Date.now() + '"');
        console.log(`Updated Cache bust ai-tutor.css in ${file}`);
    }
    
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
});
console.log('Cache busting DONE');
