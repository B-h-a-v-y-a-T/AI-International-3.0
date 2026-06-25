const fs = require('fs');

let html = fs.readFileSync('ai-tutor.html', 'utf8');

const mascotSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="bot-mascot-mini" style="width: 24px; height: 24px; display: inline-block; vertical-align: middle;">
    <ellipse cx="50" cy="18" rx="14" ry="11" fill="#FF7A1F"/>
    <circle cx="21" cy="72" r="8" fill="#FF7A1F"/>
    <circle cx="79" cy="72" r="8" fill="#FF7A1F"/>
    <ellipse cx="50" cy="54" rx="36" ry="32" fill="#FF7A1F"/>
    <rect x="16" y="42" width="16" height="24" rx="8" fill="#FF7A1F" stroke="#1E1B4B" stroke-width="2.5"/>
    <rect x="68" y="42" width="16" height="24" rx="8" fill="#FF7A1F" stroke="#1E1B4B" stroke-width="2.5"/>
    <rect x="24" y="36" width="52" height="42" rx="16" fill="#1E1B4B" />
    <path d="M 52 38 L 49 44 L 53 44 L 50 49" stroke="#FFD700" stroke-width="2" fill="none" stroke-linejoin="miter" stroke-linecap="square" />
    <circle cx="41" cy="56" r="5.5" fill="#FFFFFF"/>
    <circle cx="59" cy="56" r="5.5" fill="#FFFFFF"/>
</svg>`;

const largeMascotSvg = mascotSvg.replace('width: 24px; height: 24px;', 'width: 48px; height: 48px;');

// 1. Replace Brain Emojis
html = html.replace('<span class="logo-icon">🧠</span>', '<span class="logo-icon" style="display:flex;align-items:center;">' + mascotSvg + '</span>');
html = html.replace('<h2>🧠 AI Tutor</h2>', '<h2 style="display:flex;align-items:center;gap:8px;">' + mascotSvg + ' AI Tutor</h2>');
html = html.replace('<div class="tutor-welcome-icon">🧠</div>', '<div class="tutor-welcome-icon" style="display:flex;justify-content:center;margin-bottom:12px;">' + largeMascotSvg + '</div>');

// 2. Quick Action Chips Emojis
html = html.replace('⚡ Electrostatics', '<i data-lucide="zap" style="width:14px;height:14px;margin-right:4px;vertical-align:middle;"></i> Electrostatics');
html = html.replace('🧪 Organic Chemistry', '<i data-lucide="test-tube" style="width:14px;height:14px;margin-right:4px;vertical-align:middle;"></i> Organic Chemistry');
html = html.replace('📐 Integration', '<i data-lucide="function-square" style="width:14px;height:14px;margin-right:4px;vertical-align:middle;"></i> Integration');
html = html.replace('🧠 Quiz Me', '<i data-lucide="help-circle" style="width:14px;height:14px;margin-right:4px;vertical-align:middle;"></i> Quiz Me');
html = html.replace('🗃️ Flashcards', '<i data-lucide="layers" style="width:14px;height:14px;margin-right:4px;vertical-align:middle;"></i> Flashcards');
html = html.replace('📊 My Weak Topics', '<i data-lucide="bar-chart" style="width:14px;height:14px;margin-right:4px;vertical-align:middle;"></i> My Weak Topics');

// Header Study plan
html = html.replace('📋 Study Plan', '<i data-lucide="clipboard-list" style="width:14px;height:14px;margin-right:4px;vertical-align:middle;"></i> Study Plan');

// 3. Remove "Study Streak" and "Study Plan" Cards
const lines = html.split('\\n');
let newLines = [];
let skip = false;

for (let line of lines) {
    if (line.includes('<!-- Study Streak -->') || line.includes('<!-- Study Plan -->')) {
        skip = true;
    }
    
    if (!skip) {
        newLines.push(line);
    }
    
    if (skip && line.trim() === '</div>' && (line.includes('tutor-dash-card') || true)) {
        // We know each card is exactly wrapped in a <div> ... </div> block.
        // Let's use a regex instead on the full string. It's safer.
    }
}

// Safer Regex Removal for cards
// Find <!-- Study Streak --> to the next </div>
html = html.replace(/<!-- Study Streak -->[\s\S]*?<div class="tutor-dash-card" onclick="openTutorModal\(this\)">[\s\S]*?<\/div>[\s\S]*?<\/div>\s*<\/div>/g, '');

// Since replacing the exact div closure with regex is error prone, let's just use string slicing.
function removeCard(htmlStr, commentStr) {
    let startIdx = htmlStr.indexOf(commentStr);
    if (startIdx === -1) return htmlStr;
    
    let subStr = htmlStr.substring(startIdx);
    // Find the first <div class="tutor-dash-card"
    let cardStartIdx = subStr.indexOf('<div class="tutor-dash-card"');
    if (cardStartIdx === -1) return htmlStr;
    
    let bodyEndIdx = subStr.indexOf('</div>', subStr.indexOf('tutor-dash-card-body'));
    let cardEndIdx = subStr.indexOf('</div>', bodyEndIdx + 6); // The closing div of the card
    
    if (cardEndIdx !== -1) {
        return htmlStr.substring(0, startIdx) + htmlStr.substring(startIdx + cardEndIdx + 6);
    }
    return htmlStr;
}

html = removeCard(html, '<!-- Study Streak -->');
html = removeCard(html, '<!-- Study Plan -->');

fs.writeFileSync('ai-tutor.html', html, 'utf8');
console.log('UI updated successfully!');
