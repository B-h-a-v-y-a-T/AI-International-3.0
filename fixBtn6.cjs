const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'videos.html');
let content = fs.readFileSync(targetFile, 'utf8');

// Find the function start
const fnStart = content.indexOf('function renderTopicPills() {');
if (fnStart === -1) {
    console.error('Could not find renderTopicPills function');
    process.exit(1);
}

// Find the closing brace of the function by counting braces
let depth = 0;
let fnEnd = -1;
for (let i = fnStart; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
        depth--;
        if (depth === 0) {
            fnEnd = i + 1;
            break;
        }
    }
}

if (fnEnd === -1) {
    console.error('Could not find end of renderTopicPills function');
    process.exit(1);
}

const cleanFn = `function renderTopicPills() {
            const container = document.getElementById('topic-pills');
            if (!container) return;
            const topics = [...new Set(allVideos.map(v => v.subject).filter(Boolean))];
            container.innerHTML = [
                \`<button class="topic-btn \${activeSubject === 'all' ? 'active' : ''}" onclick="filterSubject('all', this)" data-i18n="vid.all_subjects">All Subjects</button>\`,
                ...topics.map(t => {
                    const key = t.toLowerCase();
                    return \`<button class="topic-btn \${activeSubject === key ? 'active' : ''}" onclick="filterSubject('\${key}', this)">\${t}</button>\`;
                })
            ].join('');
            if (window.i18n) i18n.translatePage();
        }`;

content = content.substring(0, fnStart) + cleanFn + content.substring(fnEnd);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully repaired renderTopicPills in videos.html');
