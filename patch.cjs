const fs = require('fs');
let content = fs.readFileSync('signup.html', 'utf8');

const replacement = `        <div class="mascot-area" aria-hidden="true"><span class="mascot-shadow"></span><span class="mascot-flame"></span><span class="mascot-body"></span><span class="mascot-face"></span><span class="ear left"></span><span class="ear right"></span><span class="eye left"></span><span class="eye right"></span><span class="arm left"></span><span class="arm right"></span></div>`;

content = content.replace(/<div class="mascot-large-container"[\s\S]*?<\/svg>\s+<\/div>/, replacement);

fs.writeFileSync('signup.html', content);
console.log('Done replacing signup mascot');
