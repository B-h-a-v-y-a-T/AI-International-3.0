const fs = require('fs');

// 1. Update ai-tutor.html
let html = fs.readFileSync('ai-tutor.html', 'utf8');

// Replace <details> with <div> and add onclick
html = html.replace(/<details class="tutor-dash-card" open>/g, '<div class="tutor-dash-card" onclick="openTutorModal(this)">');

// Replace <summary> with <div>
html = html.replace(/<summary class="tutor-dash-card-header">/g, '<div class="tutor-dash-card-header">');
html = html.replace(/<\/summary>/g, '</div>');

// Replace </details> with </div>
html = html.replace(/<\/details>/g, '</div>');

// Add Modal HTML before </body>
const modalHtml = `
    <!-- Glass Modal for Dashboard Cards -->
    <div class="summary-glass-modal" id="summaryModal" onclick="if(event.target === this) closeTutorModal()">
        <div class="summary-glass-card">
            <div class="summary-glass-head">
                <div class="summary-glass-badge"><i data-lucide="sparkles" style="width:12px;height:12px;margin-right:4px;"></i>Detail View</div>
                <button class="summary-glass-close" onclick="closeTutorModal()" aria-label="Close details">
                    <i data-lucide="x" style="width:16px;height:16px"></i>
                </button>
            </div>
            <h3 class="summary-glass-title" id="summaryCardTitle" style="display:flex;align-items:center;gap:8px;">Detail</h3>
            <div id="summaryModalBody"></div>
        </div>
    </div>
`;
if (!html.includes('id="summaryModal"')) {
    html = html.replace('</body>', modalHtml + '\n</body>');
}

fs.writeFileSync('ai-tutor.html', html, 'utf8');


// 2. Update ai-tutor.css
let css = fs.readFileSync('ai-tutor.css', 'utf8');

if (!css.includes('.summary-glass-modal')) {
    const modalCss = `
/* ── Glass Modal ──────────────────────────────────────────────────────────── */
.summary-glass-modal {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(10, 12, 22, 0.4);
    backdrop-filter: blur(10px);
    z-index: 10010;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease;
}

.summary-glass-modal.active {
    display: flex;
}

.summary-glass-card {
    width: min(540px, 100%);
    border-radius: 24px;
    padding: 20px;
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.62));
    border: 1px solid rgba(255, 255, 255, 0.82);
    box-shadow: 0 20px 45px rgba(24, 29, 54, 0.28);
    backdrop-filter: blur(14px) saturate(1.05);
    color: #1f2a44;
}

.summary-glass-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.summary-glass-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 11px;
    border-radius: 999px;
    background: rgba(99, 133, 249, 0.2);
    border: 1px solid rgba(99, 133, 249, 0.35);
    color: #3653a8;
    font-size: 12px;
    font-weight: 700;
}

.summary-glass-close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid rgba(67, 78, 108, 0.25);
    background: rgba(255, 255, 255, 0.5);
    color: #2d3a5e;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition);
}

.summary-glass-close:hover {
    transform: rotate(90deg);
    background: rgba(255, 255, 255, 0.75);
}

.summary-glass-title {
    margin: 0 0 16px;
    font-size: 22px;
    line-height: 1.3;
    color: #1f2a44;
}
`;
    css += '\n' + modalCss;
}

// Hide .tutor-dash-card-body by default
css = css.replace('.tutor-dash-card-body {\n  padding: 14px 16px;\n}', '.tutor-dash-card-body {\n  display: none;\n  padding: 14px 16px;\n}');

// Remove border from .tutor-dash-card-header because body is hidden
css = css.replace('  border-bottom: 2px solid var(--border);\n', '  /* border-bottom: 2px solid var(--border); */\n');

// Also remove pointer styles from dash card header and add to dash card itself
css = css.replace('  cursor: pointer;\n  user-select: none;', '');
css = css.replace('.tutor-dash-card {', '.tutor-dash-card {\n  cursor: pointer;\n  transition: transform 0.2s, box-shadow 0.2s;\n');
css += '\n.tutor-dash-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }\n';

fs.writeFileSync('ai-tutor.css', css, 'utf8');


// 3. Update ai-tutor.js
let js = fs.readFileSync('ai-tutor.js', 'utf8');
if (!js.includes('openTutorModal')) {
    const modalJs = `
// Dashboard Modal Logic
let currentOpenCard = null;

function openTutorModal(cardElement) {
    const modal = document.getElementById('summaryModal');
    const modalTitle = document.getElementById('summaryCardTitle');
    const modalBody = document.getElementById('summaryModalBody');
    
    // Extract title from header
    const headerEl = cardElement.querySelector('.tutor-dash-card-header');
    modalTitle.innerHTML = headerEl.innerHTML;
    
    // Get body
    const bodyEl = cardElement.querySelector('.tutor-dash-card-body');
    if (!bodyEl) return;
    
    // Move body into modal and show it
    bodyEl.style.display = 'block';
    modalBody.innerHTML = '';
    modalBody.appendChild(bodyEl);
    
    currentOpenCard = cardElement;
    modal.classList.add('active');
}

function closeTutorModal() {
    const modal = document.getElementById('summaryModal');
    const modalBody = document.getElementById('summaryModalBody');
    
    if (currentOpenCard && modalBody.firstElementChild) {
        const bodyEl = modalBody.firstElementChild;
        bodyEl.style.display = 'none';
        currentOpenCard.appendChild(bodyEl);
    }
    
    modal.classList.remove('active');
    currentOpenCard = null;
}
`;
    js += '\n' + modalJs;
    fs.writeFileSync('ai-tutor.js', js, 'utf8');
}

console.log('Refactor complete.');
