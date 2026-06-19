const fs = require('fs');

let content = fs.readFileSync('chat.html', 'utf8');

// Replace fetch URLs
content = content.replace(/fetch\('http:\/\/localhost:5050\/analyze'/g, "fetch('/api/chat'");

// Remove user_id from body
content = content.replace(/user_id: "default_user",\s+/g, '');

fs.writeFileSync('chat.html', content);
console.log('Fixed API endpoints in chat.html');
