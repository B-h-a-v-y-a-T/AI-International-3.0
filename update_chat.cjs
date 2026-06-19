const fs = require('fs');
let html = fs.readFileSync('chat.html', 'utf8');

const mascotSVG = `
<svg viewBox="0 0 100 100" style="width:36px;height:36px;display:inline-block;vertical-align:middle;margin-right:8px" class="mascot-header">
    <path d="M 30 45 C 30 25, 70 25, 70 45 L 75 75 C 75 88, 25 88, 25 75 Z" fill="#F97316" />
    <path d="M 45 25 Q 50 8 55 25 Q 60 15 65 25 Q 55 35 45 25" fill="#FF9800" />
    <rect x="33" y="40" width="34" height="22" rx="10" fill="#1E293B" />
    <g class="eyes" style="transform-origin:50% 51px;animation: blinkAnim 4s infinite;">
        <circle cx="42" cy="51" r="3.5" fill="#FFFFFF" />
        <circle cx="58" cy="51" r="3.5" fill="#FFFFFF" />
    </g>
    <circle cx="27" cy="51" r="4" fill="#334155" />
    <circle cx="73" cy="51" r="4" fill="#334155" />
    <rect x="23" y="48" width="6" height="6" rx="2" fill="#F97316" />
    <rect x="71" y="48" width="6" height="6" rx="2" fill="#F97316" />
</svg>
<style>
@keyframes blinkAnim {
    0%, 95%, 98%, 100% { transform: scaleY(1); }
    96%, 99% { transform: scaleY(0.1); }
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

html = html.replace(/<i data-lucide="bot"[\s\S]*?<\/i>/, mascotSVG);

fs.writeFileSync('chat.html', html, 'utf8');
