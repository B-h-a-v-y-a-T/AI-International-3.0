const fs = require('fs');

let chat = fs.readFileSync('chat.html', 'utf8');
chat = chat.replace(/\.chat-input-row input \{[\s\S]*?\}/g, function(m) {
    return m.replace(/border: 2px solid var\(--border\);/, 'border: none;');
});
chat = chat.replace(/\.chat-input-row button\.icon-btn \{[\s\S]*?\}/g, function(m) {
    return m.replace(/border: 2px solid var\(--border\);/, 'border: none;');
});
chat = chat.replace(/\.chat-input-row \.send-pill \{[\s\S]*?\}/g, function(m) {
    return m.replace(/border: 2px solid var\(--border\);/, 'border: none;');
});

fs.writeFileSync('chat.html', chat);
console.log('Finished chat.html hard border removal.');
