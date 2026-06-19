const fs = require('fs'); let c = fs.readFileSync('server/index.js', 'utf8'); c = c.split('..', 'public').join('..'); fs.writeFileSync('server/index.js', c);
