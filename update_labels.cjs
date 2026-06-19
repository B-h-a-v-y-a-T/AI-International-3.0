const fs = require('fs');
let file = 'learning.html';
let html = fs.readFileSync(file, 'utf8');

// Node 1
html = html.replace(
    /<span class="node-label" style="top: -40px; left: -20px;">Limits &amp; Continuity<\/span>/g,
    '<span class="node-label" style="left: 55px; top: 50%; transform: translateY(-50%);">Limits &amp; Continuity</span>'
);
html = html.replace(
    /<span class="node-label" style="top: -40px; left: -20px;">Limits & Continuity<\/span>/g,
    '<span class="node-label" style="left: 55px; top: 50%; transform: translateY(-50%);">Limits & Continuity</span>'
);

// Node 2
html = html.replace(
    /<span class="node-label" style="right: 85px; top: -10px;">The Power Rule<\/span>/g,
    '<span class="node-label" style="right: 55px; top: 50%; transform: translateY(-50%);">The Power Rule</span>'
);

// Node 3
html = html.replace(
    /<div style="position: absolute; left: 80px; top: -30px; display: flex; flex-direction: column; white-space: nowrap; z-index: 10;">/g,
    '<div style="position: absolute; left: 75px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; white-space: nowrap; z-index: 10;">'
);

// Node 4
html = html.replace(
    /<span class="node-label" style="left: 80px; top: 15px;">Chain Rule Mastery<\/span>/g,
    '<span class="node-label" style="left: 45px; top: 50%; transform: translateY(-50%);">Chain Rule Mastery</span>'
);

// Node 5
html = html.replace(
    /<span class="node-label" style="right: 80px;">Quotient Rule<\/span>/g,
    '<span class="node-label" style="right: 45px; top: 50%; transform: translateY(-50%);">Quotient Rule</span>'
);

fs.writeFileSync(file, html);
console.log('Fixed labels vertically centered');
