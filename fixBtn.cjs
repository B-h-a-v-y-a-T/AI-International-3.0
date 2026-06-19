const fs = require('fs');
const fp = 'c:/Users/bhavy/Downloads/itsahack2.0-integration1 (1)/itsahack2.0-p/videos.html';
let c = fs.readFileSync(fp, 'utf8');

c = c.replace(/onclick="Toast\.show\('Switching to Thermodynamics filter!','info'\)"/g, 'onclick="applyStudyTip(\\'Thermodynamics\\', \\'physics\\')"');

const scriptToAdd = `
function applyStudyTip(topic, subject) {
    Toast.show('Fetching recommended videos for ' + topic, 'info');
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = topic;
        activeSubject = subject.toLowerCase() || 'all';
        document.querySelectorAll('.filter-row .topic-btn').forEach(b => b.classList.remove('active'));
        const targetBtn = Array.from(document.querySelectorAll('.filter-row .topic-btn')).find(b => b.innerText.toLowerCase().includes(activeSubject));
        if (targetBtn) targetBtn.classList.add('active');
        fetchVideosFromAPI(topic);
    }
}
// Render pills first, then fetch videos`;

if (!c.includes('applyStudyTip')) {
    c = c.replace('// Render pills first, then fetch videos', scriptToAdd);
}
fs.writeFileSync(fp, c);
console.log('Fixed Show Me Logic!!!');