const fs = require('fs');
let html = fs.readFileSync('dashboard.html', 'utf8');

// 1. Remove the Tooltip
const tooltipRegex = /<!-- Tooltip matching the image -->[\s\S]*?<div style="position:absolute; bottom:-6px; right:30px; width:14px; height:14px; background:#111827; transform:rotate\(45deg\);"><\/div>\s*<\/div>/;
html = html.replace(tooltipRegex, '');

// 2. Add Mascot CSS
const mascotCSS = `
        /* Mascot Styles */
        .mascot-area {
            width: 102px;
            height: 96px;
            position: relative;
            animation: mascotBreathe 4.2s ease-in-out infinite;
            transform-origin: center bottom;
            cursor: pointer;
        }

        .mascot-shadow {
            position: absolute;
            width: 64px;
            height: 12px;
            left: 50%;
            bottom: 2px;
            transform: translateX(-50%);
            background: rgba(53, 38, 107, 0.2);
            filter: blur(0.4px);
            border-radius: 999px;
            animation: shadowPulse 4.2s ease-in-out infinite;
        }

        .mascot-flame {
            position: absolute;
            left: 50%;
            top: -1px;
            width: 28px;
            height: 26px;
            transform: translateX(-50%) rotate(-4deg);
            border-radius: 60% 44% 68% 42%;
            background: linear-gradient(180deg, #ff9f3a 0%, #ff6f19 100%);
            animation: flameWiggle 1.2s ease-in-out infinite;
        }

        .mascot-body {
            position: absolute;
            width: 74px;
            height: 64px;
            border-radius: 30px 30px 22px 22px;
            background: linear-gradient(180deg, #ff8f2e 0%, #ff6f11 100%);
            left: 50%;
            top: 20px;
            transform: translateX(-50%);
        }

        .mascot-face {
            position: absolute;
            width: 52px;
            height: 38px;
            left: 50%;
            top: 30px;
            transform: translateX(-50%);
            border-radius: 16px;
            background: #1f1a35;
            border: 2px solid rgba(255, 255, 255, 0.08);
        }

        .ear {
            position: absolute;
            width: 12px;
            height: 18px;
            top: 34px;
            border-radius: 999px;
            background: #ff781b;
            border: 2px solid #55447a;
        }

        .ear.left { left: 16px; }
        .ear.right { right: 16px; }

        .eye {
            position: absolute;
            width: 9px;
            height: 9px;
            top: 44px;
            border-radius: 50%;
            background: #fff;
            animation: eyeBlink 5s infinite;
        }

        .eye.left { left: 40px; }
        .eye.right { right: 40px; }

        .arm {
            position: absolute;
            width: 12px;
            height: 14px;
            background: #ff771a;
            top: 58px;
            border-radius: 8px;
        }

        .arm.left {
            left: 13px;
            transform: rotate(18deg);
        }

        .arm.right {
            right: 13px;
            transform: rotate(-18deg);
        }

        @keyframes mascotBreathe {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        @keyframes shadowPulse {
            0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.3; }
            50% { transform: translateX(-50%) scaleX(0.86); opacity: 0.22; }
        }

        @keyframes flameWiggle {
            0%, 100% { transform: translateX(-50%) rotate(-4deg) scale(1); }
            50% { transform: translateX(-50%) rotate(4deg) scale(1.08, 0.95); }
        }

        @keyframes eyeBlink {
            0%, 46%, 50%, 100% { transform: scaleY(1); }
            48% { transform: scaleY(0.1); }
        }
        
        .mascot-bottom-right {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 100;
        }
`;

if (!html.includes('/* Mascot Styles */')) {
    html = html.replace('</style>', mascotCSS + '\n    </style>');
}

// 3. Replace the fab-corner with the Mascot HTML
const fabRegex = /<!-- Floating FAB from the image -->[\s\S]*?<\/div>\s*<\/div>/;
const mascotHTML = `<!-- Floating Mascot -->
        <div class="mascot-bottom-right" onclick="window.location.href='chat.html'">
            <div class="mascot-area" aria-label="Chat Tutor">
                <span class="mascot-shadow"></span>
                <span class="mascot-flame"></span>
                <span class="mascot-body"></span>
                <span class="mascot-face"></span>
                <span class="ear left"></span>
                <span class="ear right"></span>
                <span class="eye left"></span>
                <span class="eye right"></span>
                <span class="arm left"></span>
                <span class="arm right"></span>
            </div>
        </div>`;

if(fabRegex.test(html)) {
    html = html.replace(fabRegex, mascotHTML);
} else {
    // If fab doesn't exist, append to body
    html = html.replace('</body>', mascotHTML + '\n</body>');
}

fs.writeFileSync('dashboard.html', html);
console.log("Dashboard Updated with Mascot!");
