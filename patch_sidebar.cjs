const fs = require('fs');
const files = ['dashboard.html', 'chat.html', 'leaderboard.html', 'quiz.html', 'exam.html', 'videos.html', 'profile.html', 'focus.html', 'learning.html'];
files.forEach(f => {
    if(fs.existsSync(f)) {
        let txt = fs.readFileSync(f, 'utf8');
        const insertPoint = '<a class="nav-item" data-page="chat.html"';
        const newHtml = `<a class="nav-item" data-page="learning.html" href="learning.html"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"></path></svg><span data-i18n="nav.learning">Learning Path</span></a>\n                <a class="nav-item" data-page="chat.html"`;
        if (txt.includes(insertPoint) && !txt.includes('data-page="learning.html"')) {
            txt = txt.replace(new RegExp(insertPoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newHtml);
            fs.writeFileSync(f, txt);
            console.log('Fixed:', f);
        }
    }
});
console.log('DONE');