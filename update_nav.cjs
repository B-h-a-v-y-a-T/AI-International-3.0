const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

const navStyles = `

/* =====================================================
   START: ALIEN FLOATING BOTTOM NAV
===================================================== */
.sidebar {
    display: none !important;
}

.main-content {
    margin-left: 0 !important;
    padding-bottom: 100px !important; /* Space for nav */
}

.bottom-nav {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.bottom-nav.nav-hidden {
    opacity: 0;
    transform: translate(-50%, 30px);
    pointer-events: none;
}

.bottom-nav-inner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 999px;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07);
}

[data-theme='dark'] .bottom-nav-inner {
    background: rgba(15, 23, 42, 0.45);
    border-color: rgba(255, 255, 255, 0.08);
}

.b-nav-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    color: var(--text-secondary);
    transition: all 0.3s ease;
    opacity: 0.6;
    text-decoration: none;
}

.b-nav-item svg {
    width: 20px;
    height: 20px;
}

.b-nav-item:hover {
    opacity: 1;
    transform: scale(1.1);
    color: var(--primary);
}

.b-nav-item.active {
    opacity: 1;
    background: var(--grad-primary);
    color: white;
    transform: scale(1.15);
    box-shadow: 0 4px 20px rgba(108, 168, 241, 0.4);
}

@media(max-width: 600px) {
    .bottom-nav-inner {
        gap: 6px;
        padding: 8px 12px;
    }
    .b-nav-item {
        width: 42px;
        height: 42px;
    }
}
/* =====================================================
   END: ALIEN FLOATING BOTTOM NAV
===================================================== */
`;

if (!css.includes('ALIEN FLOATING BOTTOM NAV')) {
    fs.appendFileSync('styles.css', navStyles);
}

let js = fs.readFileSync('app.js', 'utf8');

const navCode = `

// --- Bottom Navigation Injection and Auto-Hide ---
function injectBottomNav() {
    // Exclude auth pages if needed
    const path = window.location.pathname.split('/').pop() || '';
    if(path.includes('login') || path.includes('signup')) return;
    
    const navItems = [
        { page: 'dashboard.html', title: 'Dashboard', icon: '<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"></rect><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"></rect><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"></rect><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"></rect>' },
        { page: 'chat.html', title: 'AI Tutor', icon: '<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"></path>' },
        { page: 'leaderboard.html', title: 'Leaderboard', icon: '<polyline points=\"23 6 13.5 15.5 8.5 10.5 1 18\"></polyline><polyline points=\"17 6 23 6 23 12\"></polyline>' },
        { page: 'quiz.html', title: 'Daily Quiz', icon: '<rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\"></rect><path d=\"M16 2v4M8 2v4M3 10h18\"></path>' },
        { page: 'exam.html', title: 'Exam Mode', icon: '<path d=\"M22 10v6M2 10l10-5 10 5-10 5z\"></path><path d=\"M6 12v5c3 3 9 3 12 0v-5\"></path>' },
        { page: 'videos.html', title: 'Videos', icon: '<polygon points=\"23 7 16 12 23 17 23 7\"></polygon><rect x=\"1\" y=\"5\" width=\"15\" height=\"14\" rx=\"2\"></rect>' },
        { page: 'profile.html', title: 'Profile', icon: '<path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"></path><circle cx=\"12\" cy=\"7\" r=\"4\"></circle>' }
    ];

    const nav = document.createElement('nav');
    nav.id = 'floatingBottomNav';
    nav.className = 'bottom-nav';

    const inner = document.createElement('div');
    inner.className = 'bottom-nav-inner';
    
    // Determine active page
    let currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    // Handle root path
    if (currentPath === '' || currentPath === '/') currentPath = 'dashboard.html';

    navItems.forEach(item => {
        const a = document.createElement('a');
        a.href = item.page;
        a.title = item.title;
        a.className = 'b-nav-item';
        if(currentPath === item.page) a.classList.add('active');
        a.innerHTML = '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">' + item.icon + '</svg>';
        inner.appendChild(a);
    });

    nav.appendChild(inner);
    document.body.appendChild(nav);

    // Smart Auto-Hide Logic
    let navTimeout;
    const hideNav = () => {
        nav.classList.add('nav-hidden');
    };
    const showNav = () => {
        nav.classList.remove('nav-hidden');
        clearTimeout(navTimeout);
        navTimeout = setTimeout(hideNav, 3500); // Hide after 3.5s of inactivity
    };

    // Initial show
    showNav();

    // Event Listeners for Interaction Detection
    window.addEventListener('mousemove', showNav);
    window.addEventListener('scroll', showNav, {passive: true});
    window.addEventListener('keydown', showNav);
    window.addEventListener('touchstart', showNav, {passive: true});
    window.addEventListener('click', showNav);
}

// Append the bottom nav when the DOM is ready
document.addEventListener('DOMContentLoaded', injectBottomNav);
`;

if (!js.includes('injectBottomNav')) {
    fs.appendFileSync('app.js', navCode);
}
console.log('Update Complete!');
