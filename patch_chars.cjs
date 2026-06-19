const fs = require('fs');
const path = require('path');

const examFile = path.join(__dirname, 'exam.html');
let code = fs.readFileSync(examFile, 'utf8');

// Replace corrupted emoji characters with a valid lock icon and text
code = code.replace(/Ã¢Å¡Â\s*Ã¯Â¸Â Secure Mode/g, "Secure Mode");
code = code.replace(/âš ï¸ Secure Mode/g, "Secure Mode");
code = code.replace(/âš ï¸/g, "");
code = code.replace(/<div\nstyle="font-size:20px;font-weight:800;margin-bottom:15px;color:#ef4444;">.*?Secure Mode<\/div>/s, '<div style="font-size:20px;font-weight:800;margin-bottom:15px;color:#ef4444;">Secure Mode</div>');

fs.writeFileSync(examFile, code);
console.log('Fixed broken characters');