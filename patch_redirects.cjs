const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname);

function patchRedirect(file) {
    const fd = path.join(DIR, file);
    let code = fs.readFileSync(fd, 'utf8');

    code = code.replace(
        "window.location.href = 'dashboard.html';", 
        "const roleMode = document.getElementById('roleSwitch')?.dataset.mode; window.location.href = roleMode === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';"
    );
    
    code = code.replace(
        'window.location.href = "dashboard.html";',
        'const roleMode = document.getElementById("roleSwitch")?.dataset.mode; window.location.href = roleMode === "admin" ? "admin-dashboard.html" : "dashboard.html";'
    );
    
    fs.writeFileSync(fd, code);
}

patchRedirect('login.html');
patchRedirect('signup.html');
console.log('Redirects patched');
