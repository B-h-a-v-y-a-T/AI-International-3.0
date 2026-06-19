const fs = require('fs');
let html = fs.readFileSync('c:/Users/bhavy/Downloads/itsahack2.0-integration1 (1)/itsahack2.0-p/videos.html', 'utf8');

// Replace the dummy Show me button with real functionality
html = html.replace(
    /onclick=\"Toast\.show\('Switching to Thermodynamics filter!','info'\)\"/g,
    'onclick=\"applyStudyTip(\\'Thermodynamics\\', \\'physics\\')\"'
);

// Add the javascript for applyStudyTip
const scriptToAdd = `
        function applyStudyTip(topic, subject) {
            Toast.show('Fetching recommended videos for ' + topic, 'info');
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = topic;
                // switch to the subject if available, or 'all'
                activeSubject = subject.toLowerCase() || 'all';
                // Remove active classes from filters
                document.querySelectorAll('.filter-row .topic-btn').forEach(b => b.classList.remove('active'));
                // Try to locate and add active to the new one
                const targetBtn = Array.from(document.querySelectorAll('.filter-row .topic-btn')).find(b => b.innerText.toLowerCase().includes(activeSubject));
                if (targetBtn) targetBtn.classList.add('active');
                
                // Trigger video search directly
                fetchVideosFromAPI(topic);
            }
        }
`;

html = html.replace('// Render pills first, then fetch videos', scriptToAdd + '\n        // Render pills first, then fetch videos');

fs.writeFileSync('c:/Users/bhavy/Downloads/itsahack2.0-integration1 (1)/itsahack2.0-p/videos.html', html, 'utf8');
console.log('Fixed Show Me button logic');