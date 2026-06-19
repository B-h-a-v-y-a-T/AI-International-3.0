const fs = require('fs');

// 1. Fix chat.html inner borders
let chat = fs.readFileSync('chat.html', 'utf8');

chat = chat.replace(/\.chat-input-row button\.icon-btn\s*\{[\s\S]*?\}/, function(m) {
    return m.replace(/border:[^;]+;/, 'border: none;');
});

chat = chat.replace(/\.chat-input-row input\s*\{[\s\S]*?\}/, function(m) {
    return m.replace(/border:[^;]+;/, 'border: none;');
});

chat = chat.replace(/\.chat-input-row \.send-pill\s*\{[\s\S]*?\}/, function(m) {
    return m.replace(/border:[^;]+;/, 'border: none;');
});

// Fix emotion tag
chat = chat.replace(/<div class="emotion-tag"[^>]*>/, '<div class="emotion-tag" id="emotionTag" style="color:#1E293B; font-weight:600; font-size:13px; display:flex; align-items:center; gap:6px; background:white; padding:8px 16px; border-radius:20px; box-shadow:2px 2px 0px var(--border); cursor:pointer; border:none; margin-top: 10px;">');
chat = chat.replace(/<div class="emotion-tag"[^>]*>/g, '<div class="emotion-tag" id="emotionTag" style="color:#1E293B; font-weight:600; font-size:13px; display:flex; align-items:center; gap:6px; background:white; padding:8px 16px; border-radius:20px; box-shadow:2px 2px 0px var(--border); cursor:pointer; border:none;">'); // all

fs.writeFileSync('chat.html', chat);

// 2. Fix dashboard.html dash-search
let dash = fs.readFileSync('dashboard.html', 'utf8');
dash = dash.replace(/\.dash-search\s*\{[\s\S]*?\}/, function(m) {
    let str = m;
    str = str.replace(/background:\s*rgba\(0,0,0,0\.03\);/, 'background: white;');
    if(!str.includes('border: 2px solid')) {
        str = str.replace(/font-size:\s*14px;/, 'font-size: 14px;\n            border: 2px solid var(--border);\n            box-shadow: 2px 2px 0px var(--border);');
    }
    return str;
});

dash = dash.replace(/\.dash-search input\s*\{[\s\S]*?\}/, function(m) {
    return m.replace(/border:[^;]+;/, 'border: none;');
});

fs.writeFileSync('dashboard.html', dash);

// 3. Fix any styles.css input-field borders if they were put on the wrong place
let css = fs.readFileSync('styles.css', 'utf8');

css = css.replace(/\.input-field\s*\{[\s\S]*?\}/, function(m) {
    return m.replace(/border:\s*2px solid var\(--border\);/g, 'border: none;');
});

// And maybe chat-input in styles.css
css = css.replace(/\.chat-input\s*\{[\s\S]*?\}/, function(m) {
    return m.replace(/border:\s*1\.5px solid var\(--border\);/g, 'border: none;');
});

fs.writeFileSync('styles.css', css);

console.log('Fixed borders script finished.');
