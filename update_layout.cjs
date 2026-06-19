const fs = require('fs');
let file = 'learning.html';
let html = fs.readFileSync(file, 'utf8');

// 1. Fix grid wrapper
html = html.replace(
    /grid-template-columns: 240px 1fr 240px;/g,
    'grid-template-columns: 1fr 2fr 1fr;'
);
html = html.replace(
    /max-width: 1100px;/g,
    'max-width: 1200px; width: 100%;'
);

// 2. Fix Center Path zoom and size
// Instead of transform, let's just make the heights smaller by replacing 750px with 600px and adding scale
html = html.replace(
    /<div style="position: relative; width: 100%; height: 750px; display: flex; justify-content: center;">/g,
    '<div style="position: relative; width: 100%; height: 600px; display: flex; justify-content: center; align-items: center;">\n<div style="position: relative; width: 280px; height: 750px; transform: scale(0.8); transform-origin: center center;">'
);
// Now we need to close that extra div. We will find "<!-- Right Column: Leaderboard & Next Reward -->" and insert a closing div before it.
html = html.replace(
    /<\/div>\n\s*<!-- Right Column: Leaderboard & Next Reward -->/g,
    '</div>\n</div>\n                  <!-- Right Column: Leaderboard & Next Reward -->'
);

// Wait, the original `<!-- SVG Container -->` already had `<div style="position: absolute; width: 280px; height: 750px; ...">`. 
// So let's restore and just change the wrapper. Let's do it cleaner.
