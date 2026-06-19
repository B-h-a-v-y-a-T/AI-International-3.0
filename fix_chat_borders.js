const fs = require('fs');

let s = fs.readFileSync('chat.html', 'utf8');

// Remove borders inside .chat-input-row
s = s.replace(/\.chat-input-row button\.icon-btn\s*{[\s\S]*?}/g, function(match) {
    return match.replace(/border:[^;]+;/g, 'border: none;');
});

s = s.replace(/\.chat-input-row input\s*(?!::)[\s\S]*?{([^}]+)}/g, function(match) {
    return match.replace(/border:[^;]+;/g, 'border: none;');
});

s = s.replace(/\.chat-input-row \.send-pill\s*{[\s\S]*?}/g, function(match) {
    return match.replace(/border:[^;]+;/g, 'border: none;');
});

// Also remove border from .chat-input
s = s.replace(/\.chat-input\s*{[\s\S]*?}/g, function(match) {
    return match.replace(/border:[^;]+;/g, 'border: none;');
});

// Update the emotion tag style to be white with shadow and no border
s = s.replace(/<div class="emotion-tag"[^>]*>/g, '<div class="emotion-tag" id="emotionTag" style="color:#1E293B; font-weight:600; font-size:13px; display:flex; align-items:center; gap:6px; background:white; padding:8px 16px; border-radius:20px; box-shadow:2px 2px 0px var(--border); cursor:pointer; border:2px solid var(--border);">');
// wait they asked for no border on emotion-tag ? "instead of border"
// let's do with shadow instead of border.
s = s.replace(/<div class="emotion-tag" id="emotionTag" style="color:#1E293B; font-weight:600; font-size:13px; display:flex; align-items:center; gap:6px; background:white; padding:8px 16px; border-radius:20px; box-shadow:2px 2px 0px var\(--border\); cursor:pointer; border:2px solid var\(--border\);">/g, 
    '<div class="emotion-tag" id="emotionTag" style="color:#1E293B; font-weight:600; font-size:13px; display:flex; align-items:center; gap:6px; background:white; padding:8px 16px; border-radius:20px; box-shadow:2px 2px 0px var(--border); cursor:pointer; border:none;">');

// And handle previous case
s = s.replace(/<div class="emotion-tag"[^>]*>/g, '<div class="emotion-tag" id="emotionTag" style="color:#1E293B; font-weight:600; font-size:13px; display:flex; align-items:center; gap:6px; background:white; padding:8px 16px; border-radius:20px; box-shadow:2px 2px 0px var(--border); cursor:pointer; border:none;">');


fs.writeFileSync('chat.html', s);
console.log('Fixed chat borders.');
