const fs = require('fs');

let html = fs.readFileSync('dashboard.html', 'utf8');

const newStyles = `
        /* New Dashboard Styles */
        .dash-topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        .dash-title {
            font-size: 24px;
            font-weight: 800;
        }
        .dash-search-container {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .dash-search {
            display: flex;
            align-items: center;
            background: rgba(0,0,0,0.03);
            padding: 8px 16px;
            border-radius: 20px;
            color: var(--text-muted);
            font-size: 14px;
        }
        .dash-search input {
            border: none;
            background: none;
            outline: none;
            margin-left: 8px;
            width: 200px;
            color: var(--text);
            font-family: inherit;
        }
        .dash-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 24px;
        }
        @media(max-width: 900px) {
            .dash-grid { grid-template-columns: 1fr; }
        }
        .hero-section {
            padding: 24px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
        }
        .hero-text h1 {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .hero-text p {
            color: var(--text-muted);
            font-size: 15px;
            max-width: 300px;
            line-height: 1.5;
        }
        .btn-focus {
            background: #3B82F6;
            color: white;
            padding: 16px 32px;
            border-radius: 30px;
            font-size: 16px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
            transition: all 0.3s;
            font-family: inherit;
        }
        .btn-focus:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
        }
        .dash-card {
            background: white;
            border-radius: 24px;
            padding: 28px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.03);
            margin-bottom: 24px;
            position: relative;
        }
        .card-label {
            font-size: 12px;
            font-weight: 700;
            color: #D97706;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
        }
        .current-path-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%);
            min-height: 280px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .path-title {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 12px;
            line-height: 1.2;
            color: #111827;
        }
        .path-desc {
            color: var(--text-muted);
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 30px;
            max-width: 85%;
        }
        .progress-block {
            background: white;
            padding: 16px 20px;
            border-radius: 16px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.04);
            display: inline-block;
            width: 220px;
        }
        .streak-big {
            font-size: 48px;
            font-weight: 800;
            display: flex;
            align-items: baseline;
            gap: 8px;
            color: #111827;
        }
        .streak-big span {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-muted);
        }
        .streak-circles {
            display: flex;
            gap: 12px;
            margin-top: 24px;
            align-items: center;
        }
        .streak-circle {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #EFF6FF;
            color: #3B82F6;
            font-size: 14px;
            font-weight: 600;
        }
        .streak-circle.done {
            background: #3B82F6;
            color: white;
            box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
        }
        .streak-circle.off {
            background: #F3F4F6;
            color: #9CA3AF;
        }
        .target-list {
            margin-top: 20px;
        }
        .target-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 0;
            border-bottom: 1px solid var(--border);
        }
        .target-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        .target-num {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #FEF2F2;
            color: #EF4444;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            flex-shrink: 0;
        }
        .target-text {
            font-size: 15px;
            font-weight: 700;
            color: #111827;
        }
        .target-sub {
            font-size: 13px;
            color: var(--text-muted);
            margin-top: 4px;
        }
        .view-all {
            position: absolute;
            top: 28px;
            right: 28px;
            font-size: 13px;
            color: #3B82F6;
            font-weight: 700;
            text-decoration: none;
        }
        .fab-corner {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 56px;
            height: 56px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            cursor: pointer;
            z-index: 100;
        }
        .fab-corner-inner {
            width: 36px;
            height: 36px;
            background: #3B82F6;
            border-radius: 8px;
            transform: rotate(15deg);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
`;

if (!html.includes('/* New Dashboard Styles */')) {
    html = html.replace('</style>', newStyles + '\n    </style>');
}

const mainContent = `
        <main class="main-content" style="background: radial-gradient(circle at top right, rgba(243,232,255,0.5), transparent 40%), radial-gradient(circle at bottom left, rgba(219,234,254,0.3), transparent 40%); padding: 40px; position:relative; overflow:hidden;">
            <!-- Top Navbar -->
            <div class="dash-topbar">
                <div class="dash-title">Dashboard</div>
                <div class="dash-search-container">
                    <div class="dash-search">
                        <i data-lucide="search" style="width:16px;height:16px"></i>
                        <input type="text" placeholder="Search concepts..." />
                    </div>
                    <div style="position:relative; width:44px; height:44px; border-radius:50%; background:white; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 15px rgba(0,0,0,0.03); color:var(--text-muted); border: 1px solid var(--border); cursor:pointer;">
                        <i data-lucide="bell" style="width:20px;height:20px"></i>
                        <span style="position:absolute; top:12px; right:12px; width:8px; height:8px; background:#EF4444; border-radius:50%; border:2px solid white"></span>
                    </div>
                </div>
            </div>

            <!-- Hero Section -->
            <div class="hero-section animate-in">
                <div class="hero-text">
                    <h1 id="userGreeting">Welcome back, Alex! <span style="font-size: 32px">👋</span></h1>
                    <p>You've learned for 8 hours this week. Keep it up!</p>
                </div>
                <button class="btn-focus">
                    <i data-lucide="play" style="fill:white; width:18px; height:18px"></i> Start Focus Stream
                </button>
            </div>

            <div class="dash-grid">
                <!-- Left Column -->
                <div class="animate-in delay-1">
                    <div class="dash-card current-path-card">
                        <div style="margin-bottom: auto;">
                            <div class="card-label" style="background:#FFF3E0; color:#E65100; padding:6px 12px; border-radius:12px; display:inline-block;">CURRENT PATH</div>
                            <div class="path-title">Data Structures<br/>in Python</div>
                            <div class="path-desc">Mastering Trees, Graphs, and Hashmaps. You are currently on module 4 of 10.</div>
                        </div>
                        
                        <div class="progress-block">
                            <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:800; margin-bottom:12px; color:#111827">
                                <span>Progress</span>
                                <span>45%</span>
                            </div>
                            <div style="height:10px; background:#E5E7EB; border-radius:5px; overflow:hidden; margin-bottom:12px">
                                <div style="height:100%; width:45%; background:#3B82F6; border-radius:5px;"></div>
                            </div>
                            <div style="font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:6px; font-weight:500;">
                                <i data-lucide="clock" style="width:14px;height:14px"></i> 2.5 hrs remaining
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column -->
                <div class="animate-in delay-2">
                    <!-- Streak Card -->
                    <div class="dash-card">
                        <div class="card-label" style="color:#9CA3AF;">LEARNING STREAK</div>
                        <div style="position:absolute; top:28px; right:28px; width:40px; height:40px; background:#FFF7ED; color:#F97316; border-radius:12px; display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="flame" style="width:24px;height:24px; fill:#F97316"></i>
                        </div>
                        <div class="streak-big">14 <span>Days</span></div>
                        
                        <div class="streak-circles">
                            <div class="streak-circle done"><i data-lucide="check" style="width:18px;height:18px"></i></div>
                            <div class="streak-circle done"><i data-lucide="check" style="width:18px;height:18px"></i></div>
                            <div class="streak-circle done"><i data-lucide="check" style="width:18px;height:18px"></i></div>
                            <div class="streak-circle done"><i data-lucide="check" style="width:18px;height:18px"></i></div>
                            <div class="streak-circle" style="background:#FFF7ED; color:#F97316"><i data-lucide="zap" style="width:18px;height:18px; fill:#F97316"></i></div>
                            <div class="streak-circle off">S</div>
                            <div class="streak-circle off">S</div>
                            <div style="margin-left:auto; width:32px; height:32px; background:#4B5563; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                                <i data-lucide="chevron-right" style="width:16px;height:16px"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Target Areas Card -->
                    <div class="dash-card">
                        <div class="card-label" style="color:#9CA3AF;">TARGET AREAS</div>
                        <a href="#" class="view-all">View All</a>
                        
                        <!-- Tooltip matching the image -->
                        <div style="background:#111827; color:white; padding:12px 20px; border-radius:16px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:8px; position:absolute; top:-20px; right:20px; box-shadow:0 10px 25px rgba(0,0,0,0.15); z-index:10; animation: floatIn 0.5s ease-out;">
                            Need review on Hash Maps? <span style="font-size:16px;">💡</span>
                            <div style="position:absolute; bottom:-6px; right:30px; width:14px; height:14px; background:#111827; transform:rotate(45deg);"></div>
                        </div>

                        <div class="target-list">
                            <div class="target-item">
                                <div class="target-num">1</div>
                                <div>
                                    <div class="target-text">Hash Maps Basics</div>
                                    <div class="target-sub">Scored 45% on last test</div>
                                </div>
                            </div>
                            <div class="target-item">
                                <div class="target-num" style="background:#FFF7ED; color:#F97316">2</div>
                                <div>
                                    <div class="target-text">Graph Traversal (BFS)</div>
                                    <div class="target-sub">Missed 3 conceptual questions</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </main>
        
        <!-- Floating FAB from the image -->
        <div class="fab-corner" onclick="window.location.href='chat.html'">
            <div class="fab-corner-inner">
                <i data-lucide="layers" style="width:20px;height:20px; transform:rotate(-15deg);"></i>
            </div>
            <div style="position:absolute; top:-4px; right:-4px; width:12px; height:12px; background:#3B82F6; border-radius:50%; border:2px solid white;"></div>
        </div>
`;

// Replace `main-content` and the fab AI
let startIdx = html.indexOf('<main class="main-content">');
let endIdx = html.indexOf('</main>', startIdx) + 7;
if(startIdx !== -1) {
    html = html.substring(0, startIdx) + mainContent + html.substring(endIdx);
}

// Remove old fab-ai
html = html.replace(/<div class="fab-ai".*?<\/div>/s, '');

// Script Logic for Dynamic Name
const scriptLogic = `
    <script>
        lucide.createIcons();
        
        let lsUser = localStorage.getItem('ls-user');
        if(lsUser) {
            try {
                let u = JSON.parse(lsUser);
                let heroGreeting = document.getElementById('userGreeting');
                if(heroGreeting && u.name) {
                    heroGreeting.innerHTML = \`Welcome back, \${u.name.split(' ')[0]}! <span style="font-size: 32px">👋</span>\`;
                }
            } catch(e) {}
        }
`;

html = html.replace(/<script>\s*lucide\.createIcons\(\);\s*.*?<\/script>/s, scriptLogic + "\n    </script>");

fs.writeFileSync('dashboard.html', html);
console.log("Dashboard Updated!");
