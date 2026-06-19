const fs = require('fs');

function patchFile(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Scale down the animation
    content = content.replace(
        /@keyframes mascotBreathe\s*\{\s*0%,\s*100%\s*\{\s*transform:\s*translateY\(0\);\s*\}\s*50%\s*\{\s*transform:\s*translateY\(-5px\);\s*\}\s*\}/s,
        `@keyframes mascotBreathe {
            0%, 100% { transform: translateY(0) scale(0.65); }
            50% { transform: translateY(-5px) scale(0.65); }
        }`
    );

    // Adjust the container height and margin to account for scaled content
    content = content.replace(
        /\.mascot-area\s*\{[\s\S]*?transform-origin:\s*center bottom;\s*\}/s,
        `.mascot-area {
            width: 102px;
            height: 60px;
            margin: 0 auto 10px;
            position: relative;
            animation: mascotBreathe 4.2s ease-in-out infinite;
            transform-origin: center bottom;
        }`
    );

    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
}

patchFile('login.html');
patchFile('signup.html');
