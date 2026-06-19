const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Only patch if it has the sidebar or app layout
    if (content.includes('sidebar-nav') || content.includes('main-content') || content.includes('app-layout')) {
        // Remove old bottom nav if exists
        content = content.replace(/<!-- FLOATING BOTTOM NAV -->[\s\S]*?<!-- END FLOATING BOTTOM NAV -->\n?/g, '');
        
        let extraNavClass = '';
        if (file === 'chat.html') extraNavClass = ' chat-nav-vertical';

        const items = [
            { page: 'dashboard.html', icon: 'layout-grid', title: 'Dashboard' },
            { page: 'learning.html', icon: 'route', title: 'Learning Path' },
            { page: 'chat.html', icon: 'message-square', title: 'AI Tutor' },
            { page: 'community.html', icon: 'users', title: 'Community' },
            { page: 'leaderboard.html', icon: 'trending-up', title: 'Leaderboard' },
            { page: 'quiz.html', icon: 'calendar', title: 'Daily Quiz' },
            { page: 'revision.html', icon: 'file-text', title: 'Revision Notes' },
            { page: 'exam.html', icon: 'graduation-cap', title: 'Exam Mode' },
            { page: 'videos.html', icon: 'video', title: 'Videos' },
            { page: 'profile.html', icon: 'user', title: 'Profile' }
        ];

        let innerHtml = '';
        items.forEach(it => {
            const activeClass = it.page === file ? ' active' : '';
            innerHtml += `\n            <a href="${it.page}" class="b-nav-item${activeClass}" title="${it.title}">\n                <i data-lucide="${it.icon}"></i>\n            </a>`;
        });

        const navHtml = `
<!-- FLOATING BOTTOM NAV -->
<nav class="bottom-nav${extraNavClass}">
    <div class="bottom-nav-inner">${innerHtml}
    </div>
</nav>
<!-- END FLOATING BOTTOM NAV -->
`;
        
        // Insert right before </body>
        content = content.replace('</body>', `${navHtml}</body>`);
        fs.writeFileSync(path.join(dir, file), content, 'utf8');
        console.log(`Patched bottom nav into ${file}`);
    }
});
