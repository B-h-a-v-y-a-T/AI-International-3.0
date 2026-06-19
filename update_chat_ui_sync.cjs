const fs = require('fs');
let html = fs.readFileSync('chat.html', 'utf8');

const mascotSVG = `
<svg viewBox="0 0 100 100" style="width:36px;height:36px;display:inline-block;vertical-align:middle;margin-right:8px" class="mascot-header">
    <path d="M 30 45 C 30 20, 70 20, 70 45 L 75 75 C 75 88, 25 88, 25 75 Z" fill="#F97316" />
    <path d="M 50 25 C 45 20, 45 10, 50 10 C 52 15, 52 20, 50 25 Z" fill="#D95C10" />
    <path d="M 50 25 C 55 20, 58 12, 53 12 C 53 17, 51 22, 50 25 Z" fill="#FC7F19" />
    <rect x="23" y="44" width="8" height="12" rx="4" fill="#D95C10" />
    <rect x="69" y="44" width="8" height="12" rx="4" fill="#D95C10" />
    <rect x="33" y="40" width="34" height="22" rx="10" fill="#1E293B" />
    <g class="eyes" style="transform-origin:50% 51px;animation: blinkAnim 5s infinite;">
        <circle cx="42" cy="51" r="3.5" fill="#FFFFFF" />
        <circle cx="58" cy="51" r="3.5" fill="#FFFFFF" />
    </g>
</svg>
<style>
@keyframes blinkAnim {
    0%, 46%, 48%, 100% { transform: scaleY(1); }
    47%, 49% { transform: scaleY(0.1); }
}
.mascot-header {
    animation: floatAnim 3s ease-in-out infinite;
}
@keyframes floatAnim {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
}
</style>
`;

html = html.replace(/<svg viewBox="0 0 100 100" style="width:36px;height:36px;[\s\S]*?<\/style>/, mascotSVG);
fs.writeFileSync('chat.html', html, 'utf8');
