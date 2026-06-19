const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'videos.html');

let content = fs.readFileSync(targetFile, 'utf8');

const regex = /container\.innerHTML = \[\s*`<button class="topic-btn \$\{activeSubject === 'all' \? 'active' : ''\}" onclick="filterSubject\('all',this\)" data-i18n="vid\.all_subjects">.*? All Subjects<\/button>`,\s*\.\.\.topics\.map\(t => \{\s*const key = t\.toLowerCase\(\);\s*const emoji = TOPIC_EMOJI\[t\] || '.*?';\s*return `<button class="topic-btn \$\{activeSubject === key \? 'active' : ''\}" onclick="filterSubject\('\$\{key\}',this\)">\$\{emoji\} \$\{t\}<\/button>`;\s*\}\)\s*\]\.join\(''\);/g;

const replacement = `container.innerHTML = [
        \`<button class="topic-btn \${activeSubject === 'all' ? 'active' : ''}" onclick="filterSubject('all', this)" data-i18n="vid.all_subjects">All Subjects</button>\`,
        ...topics.map(t => {
            const key = t.toLowerCase();
            return \`<button class="topic-btn \${activeSubject === key ? 'active' : ''}" onclick="filterSubject('\${key}', this)">\${t}</button>\`;
        })
    ].join('');`;

content = content.replace(regex, replacement);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Fixed Topic Pills in videos.html');