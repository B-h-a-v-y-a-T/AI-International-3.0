const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const aiTutorNavHTML = `                <a class="nav-item" data-page="ai-tutor.html" href="ai-tutor.html">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2z"></path>
                        <circle cx="9" cy="13" r="1"></circle>
                        <circle cx="15" cy="13" r="1"></circle>
                    </svg>
                    <span data-i18n="nav.ai_tutor">AI Tutor</span>
                </a>\n`;

htmlFiles.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Check if ai-tutor.html is already in the sidebar (to prevent duplicates)
    if (content.includes('data-page="ai-tutor.html"')) {
        // Skip ai-tutor.html since I wrote it with lucide icons, but if it has it we can just skip or fix it later
        if (file !== 'ai-tutor.html' && file !== 'chat.html') {
            return;
        }
    }

    const insertPoint = '<a class="nav-item" data-page="chat.html"';
    
    if (content.includes(insertPoint) && !content.includes('data-page="ai-tutor.html"')) {
        content = content.replace(insertPoint, aiTutorNavHTML + '                ' + insertPoint);
        fs.writeFileSync(path.join(dir, file), content, 'utf8');
        console.log(`Added sidebar nav to ${file}`);
    }
});
console.log('Sidebar patch DONE');
