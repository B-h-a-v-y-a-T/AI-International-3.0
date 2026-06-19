const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const revisionNavItem = `
                <a class="nav-item" data-page="revision.html" href="revision.html">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span data-i18n="nav.revision">Revision Notes</span>
                </a>`;

files.forEach(file => {
    if (file === 'revision.html') return; // already done

    const targetFile = path.join(dir, file);
    let content = fs.readFileSync(targetFile, 'utf8');

    // Make sure we haven't already patched it
    if (!content.includes('revision.html')) {
        // Find the quiz.html link block
        // It looks something like: <a class="nav-item" data-page="quiz.html" href="quiz.html"> ... </a>
        const quizPattern = /<a class="nav-item[^>]*data-page="quiz\.html"[\s\S]*?<\/a>/;
        const match = content.match(quizPattern);

        if (match) {
            content = content.replace(match[0], match[0] + revisionNavItem);
            fs.writeFileSync(targetFile, content, 'utf8');
            console.log(`Patched nav in ${file}`);
        }
    }
});
