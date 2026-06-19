const fs = require('fs');

const miniSvgMascot = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="bot-mascot-mini" style="width: 100%; height: 100%; display: block;">
    <ellipse cx="50" cy="18" rx="14" ry="11" fill="#FF7A1F"/>
    <circle cx="21" cy="72" r="8" fill="#FF7A1F"/>
    <circle cx="79" cy="72" r="8" fill="#FF7A1F"/>
    <ellipse cx="50" cy="54" rx="36" ry="32" fill="#FF7A1F"/>
    <rect x="16" y="42" width="16" height="24" rx="8" fill="#FF7A1F" stroke="#1E1B4B" stroke-width="2.5"/>
    <rect x="68" y="42" width="16" height="24" rx="8" fill="#FF7A1F" stroke="#1E1B4B" stroke-width="2.5"/>
    <rect x="24" y="36" width="52" height="42" rx="16" fill="#1E1B4B"/>
    <circle cx="41" cy="56" r="5.5" fill="#FFFFFF"/>
    <circle cx="59" cy="56" r="5.5" fill="#FFFFFF"/>
</svg>
`.trim();

let v = fs.readFileSync('videos.html','utf8');
v = v.replace(/<i data-lucide="bot"[^>]*><\/i>/g, '<div class="mascot-mini" style="width:36px;height:36px">' + miniSvgMascot + '</div>');
fs.writeFileSync('videos.html', v);
console.log('patched videos.html');
