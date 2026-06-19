const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && f !== 'focus.html');

for(const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    // Remove the currently injected Focus Mode link
    content = content.replace(/\s*<a class="nav-item" data-page="focus\.html"[\s\S]*?<span>Focus Mode<\/span><\/a>/g, '');
    
    // Inject it perfectly formatted before the profile
    const target = `<a class="nav-item" data-page="profile.html"`;
    const properlyFormattedLink = `                <a class="nav-item" data-page="focus.html" href="focus.html"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Focus Mode</span></a>\n                `;
    
    if (content.includes(target)) {
        content = content.replace(target, properlyFormattedLink + target);
        fs.writeFileSync(file, content);
        console.log('Fixed ' + file);
    }
}
