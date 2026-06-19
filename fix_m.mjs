import fs from 'fs';
let t = fs.readFileSync('videos.html', 'utf8');
t = t.replace(/â€“/g, '–').replace(/â€”/g, '—').replace(/âˆ‘/g, '∑').replace(/ðŸ§/g, '🧠').replace(/ðŸŒ²/g, '🌲').replace(/ðŸ’»/g, '💻').replace(/ðŸŒ/g, '🌐').replace(/ðŸ—„ï¸/g, '🗄️').replace(/âš™ï¸/g, '⚙️');
fs.writeFileSync('videos.html', t, 'utf8');
