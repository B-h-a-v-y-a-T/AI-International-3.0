const fs = require('fs');
let html = fs.readFileSync('learning.html', 'utf8');
html = html.replace(/<a class="nav-item active"[^>]*data-page="dashboard.html"/, '<a class="nav-item" data-page="dashboard.html"');
html = html.replace(/<a class="nav-item"[^>]*data-page="learning.html"/, '<a class="nav-item active" data-page="learning.html"');
fs.writeFileSync('learning.html', html);
