const fs = require('fs');
let file = 'learning.html';
let html = fs.readFileSync(file, 'utf8');

const regex = /<style>[\s\S]*?<\/style>/;
const newStyles = `<style>
@keyframes blinkGradientRing {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
  50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
}
@keyframes blinkGradientIcon {
  0% { background-position: 0% 50%; filter: drop-shadow(0 4px 10px rgba(139,92,246,0.3)); }
  50% { background-position: 100% 50%; filter: drop-shadow(0 8px 25px rgba(139,92,246,0.8)) brightness(1.2); }
  100% { background-position: 0% 50%; filter: drop-shadow(0 4px 10px rgba(139,92,246,0.3)); }
}
@keyframes blinkGreenIcon {
  0% { background-position: 0% 50%; filter: drop-shadow(0 4px 10px rgba(34,197,94,0.3)); }
  50% { background-position: 100% 50%; filter: drop-shadow(0 8px 25px rgba(34,197,94,0.8)) brightness(1.15); }
  100% { background-position: 0% 50%; filter: drop-shadow(0 4px 10px rgba(34,197,94,0.3)); }
}
.node-loc {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
}
.node-label {
  position: absolute;
  font-weight: 700;
  color: #4b5563;
  font-size: 14px;
  white-space: nowrap;
}
.icon-neon-green {
  background: linear-gradient(135deg, #22c55e, #10b981, #22c55e) !important;
  background-size: 200% 200% !important;
  animation: blinkGreenIcon 2.5s infinite ease-in-out;
}
.icon-neon-purple {
  background: linear-gradient(135deg, #8b5cf6, #6366f1, #8b5cf6) !important;
  background-size: 200% 200% !important;
  animation: blinkGradientIcon 2s infinite ease-in-out;
}
</style>`;

html = html.replace(regex, newStyles);

// Find the green nodes and inject the class
html = html.replace(/background: #22c55e;/g, 'background: #22c55e;" class="icon-neon-green');

// Find the purple star node and inject the class
html = html.replace(/background: linear-gradient\(135deg, #8b5cf6, #6366f1\);/g, 'background: linear-gradient(135deg, #8b5cf6, #6366f1);" class="icon-neon-purple');

html = html.replace(/animation: blinkGradient 2s/g, 'animation: blinkGradientRing 2s');

fs.writeFileSync(file, html);
console.log('Fixed animations');
