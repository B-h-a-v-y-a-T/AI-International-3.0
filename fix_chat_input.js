const fs = require('fs');

let chat = fs.readFileSync('chat.html', 'utf8');

chat = chat.replace('.chat-input-row input {\n            flex: 1;\n            background: transparent;\n            border: 2px solid var(--border);', 
'.chat-input-row input {\n            flex: 1;\n            background: transparent;\n            border: none;');

chat = chat.replace('.chat-input-row button.icon-btn {\n            background: none;\n            border: 2px solid var(--border);',
'.chat-input-row button.icon-btn {\n            background: none;\n            border: none;');

chat = chat.replace('.chat-input-row .send-pill {\n            background: #94A3B8;\n            color: white;\n            border: 2px solid var(--border);',
'.chat-input-row .send-pill {\n            background: #94A3B8;\n            color: white;\n            border: none;');

fs.writeFileSync('chat.html', chat);

