const fs = require('fs');
const path = require('path');
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));

for (const file of files) {
    let content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    // If it starts with empty lines and then <meta, it's missing DOCTYPE html head
    if (!content.includes('<!DOCTYPE html>') && content.includes('<meta charset="UTF-8">')) {
        // Find the first <meta>
        const metaIdx = content.indexOf('<meta charset="UTF-8">');
        if (metaIdx > -1) {
            // Replace everything before <meta> with a clean doctype and head start
            content = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' + content.substring(metaIdx);
            
            // Now, we also need to close </head> and open <body> before the layout starts.
            // A good marker is </style> or before <div class="layout">
            if (content.includes('<div class="layout">')) {
                content = content.replace('<div class="layout">', '</head>\n<body>\n    <div class="layout">');
            } else if (content.includes('</style>')) {
                content = content.replace('</style>', '</style>\n</head>\n<body>\n');
            }

            fs.writeFileSync(path.join(__dirname, file), content, 'utf8');
            console.log("Patched DOCTYPE for: " + file);
        }
    }
}
