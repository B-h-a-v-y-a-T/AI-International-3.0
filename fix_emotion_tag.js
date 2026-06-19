const fs = require('fs');

let chat = fs.readFileSync('chat.html', 'utf8');

chat = chat.replace(
    /<div class="emotion-tag" id="emotionTag"[^>]*>/g,
    '<div class="emotion-tag" id="emotionTag" style="color:#1E293B; font-weight:600; font-size:13px; display:flex; align-items:center; gap:6px; background:white; padding:8px 16px; border-radius:20px; box-shadow:2px 2px 0px var(--border); cursor:pointer; border:none;">'
);

fs.writeFileSync('chat.html', chat);
console.log('Emotion tag fixed.');
