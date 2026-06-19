const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

// Remove border from global inputs
css = css.replace(/\.input-field\s*{[\s\S]*?}/g, function(match) {
    return match.replace(/border: 2px solid var\(--border\);/g, 'border: none;');
});

css = css.replace(/\.chat-input\s*{[\s\S]*?}/g, function(match) {
    return match.replace(/border: 1.5px solid var\(--border\);/g, 'border: none;');
});

// Any search bar in dashboard
let dash = fs.readFileSync('dashboard.html', 'utf8');
dash = dash.replace(/\.dash-search\s*{[\s\S]*?}/g, function(match) {
    if(!match.includes('border: 2px solid')) {
         return match;
    }
    return match.replace(/border: 2px solid var\(--border\);/g, 'border: none;').replace(/box-shadow: 2px 2px 0px var\(--border\);/g, '');
});

fs.writeFileSync('styles.css', css);
fs.writeFileSync('dashboard.html', dash);
console.log('Fixed styles.');
