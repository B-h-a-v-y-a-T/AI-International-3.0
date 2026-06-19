const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, 'dashboard.html');
let template = fs.readFileSync(dashPath, 'utf8');

// Replace standard links with Admin links
template = template.replace(/<a href="dashboard.html" class="nav-item active">.*?<\/a>/s, '<a href="admin-dashboard.html" class="nav-item active"><i data-lucide="layout-dashboard"></i> Overview</a>');
template = template.replace(/<a href="exam.html" class="nav-item">.*?<\/a>/s, '<a href="admin-search.html" class="nav-item"><i data-lucide="search"></i> Student Search</a>');
template = template.replace(/<a href="focus.html".*?<\/a>/s, '');
template = template.replace(/<a href="leaderboard.html".*?<\/a>/s, '');
template = template.replace(/<a href="videos.html".*?<\/a>/s, '');
template = template.replace(/<a href="quiz.html".*?<\/a>/s, '');

// Clean the main content wrapper
const startMarker = '<div class="dash-topbar">';
const endIdx = template.indexOf('<script>');
const topNavIdx = template.indexOf(startMarker);

const head = template.substring(0, topNavIdx);
const tail = template.substring(endIdx);

// --- 1. ADMIN DASHBOARD ---
const adminDashContent = `
        <div class="top-nav">
            <div style="display:flex;align-items:center;gap:15px">
                <div class="user-avatar">
                   <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
                       <!-- Admin avatar simple icon -->
                       <rect width="100%" height="100%" fill="var(--primary)"/>
                       <path d="M50 25a15 15 0 100 30 15 15 0 000-30zm-25 50c0-12 12-20 25-20s25 8 25 20v5H25v-5z" fill="#fff"/>
                   </svg>
                </div>
                <div>
                   <div style="font-size: 13px; color: var(--text-muted);">Welcome back,</div>
                   <div style="font-weight: 800; font-size: 16px;">Admin <span style="background:var(--primary);color:#fff;font-size:10px;padding:2px 6px;border-radius:99px;margin-left:5px">STAFF</span></div>
                </div>
            </div>
            <button class="icon-btn" onclick="logout()"><i data-lucide="log-out"></i></button>
        </div>

        <div class="card mb-20" style="background:linear-gradient(135deg,rgba(255, 123, 18, 0.1),rgba(255, 123, 18, 0.05));border-color:rgba(255, 123, 18, 0.2);">
            <h2 style="margin:0 0 5px 0;color:#ff7b12;font-weight:800;font-size:22px">Admin Overview</h2>
            <p style="margin:0;color:var(--text-muted);font-size:14px">Monitor student progress, streaks, and engagement risks.</p>
        </div>

        <div class="stats-grid">
            <div class="card stat-card" style="text-align:center;padding:24px">
                <div class="stat-icon" style="margin:0 auto 10px;background:rgba(59,130,246,0.1)">
                    <i data-lucide="users"></i>
                </div>
                <div style="font-size:28px;font-weight:800;line-height:1">1,248</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:6px">Total Students</div>
            </div>
            <div class="card stat-card" style="text-align:center;padding:24px">
                <div class="stat-icon" style="margin:0 auto 10px;background:rgba(16,185,129,0.1);color:#10b981">
                    <i data-lucide="flame"></i>
                </div>
                <div style="font-size:28px;font-weight:800;line-height:1">412</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:6px">Active Streaks</div>
            </div>
            <div class="card stat-card" style="text-align:center;padding:24px">
                <div class="stat-icon" style="margin:0 auto 10px;background:rgba(239,68,68,0.1);color:#ef4444">
                    <i data-lucide="alert-triangle"></i>
                </div>
                <div style="font-size:28px;font-weight:800;line-height:1">8.4%</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:6px">At Risk / Burnout</div>
            </div>
        </div>

        <div class="card">
            <h3 style="margin: 0 0 15px 0;font-size:16px;">Student Roster & Activity</h3>
            <table style="width:100%;border-collapse:collapse;text-align:left;">
                <thead>
                    <tr style="border-bottom:2px solid var(--border);color:var(--text-muted);font-size:13px;">
                        <th style="padding:12px 10px">Student</th>
                        <th style="padding:12px 10px">Recent Activity</th>
                        <th style="padding:12px 10px">Streak</th>
                        <th style="padding:12px 10px">Depression/Dropout Risk</th>
                    </tr>
                </thead>
                <tbody style="font-size:14px">
                    <tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:12px 10px;font-weight:700">Vedant Sharma</td>
                        <td style="padding:12px 10px">Completed "Thermodynamics Quiz"</td>
                        <td style="padding:12px 10px;color:#f59e0b"><i data-lucide="flame" style="width:14px;display:inline-block;vertical-align:-2px"></i> 4 days</td>
                        <td style="padding:12px 10px;color:#ef4444;font-weight:800">42% (High Stress)</td>
                    </tr>
                    <tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:12px 10px;font-weight:700">Aditi Desai</td>
                        <td style="padding:12px 10px">Watched "Kinematics 101"</td>
                        <td style="padding:12px 10px;color:#f59e0b"><i data-lucide="flame" style="width:14px;display:inline-block;vertical-align:-2px"></i> 12 days</td>
                        <td style="padding:12px 10px;color:#10b981;font-weight:600">4% (Stable)</td>
                    </tr>
                    <tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:12px 10px;font-weight:700">Rohan Kapoor</td>
                        <td style="padding:12px 10px">Failed Mock Test 3</td>
                        <td style="padding:12px 10px;color:var(--text-muted)">0 days</td>
                        <td style="padding:12px 10px;color:#ef4444;font-weight:800">68% (Critical)</td>
                    </tr>
                    <tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:12px 10px;font-weight:700">Sneha Iyer</td>
                        <td style="padding:12px 10px">Focus Mode (45 mins)</td>
                        <td style="padding:12px 10px;color:#f59e0b"><i data-lucide="flame" style="width:14px;display:inline-block;vertical-align:-2px"></i> 27 days</td>
                        <td style="padding:12px 10px;color:#10b981;font-weight:600">8% (Stable)</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </main>
`;

let finalDash = head + adminDashContent + tail;
finalDash = finalDash.replace(/<title>.*?<\/title>/, '<title>Admin Dashboard â€“ AdaptEd</title>');
fs.writeFileSync(path.join(__dirname, 'admin-dashboard.html'), finalDash);

// --- 2. ADMIN SEARCH ---
let adminSearchNav = head.replace('<a href="admin-dashboard.html" class="nav-item active">', '<a href="admin-dashboard.html" class="nav-item">');
adminSearchNav = adminSearchNav.replace('<a href="admin-search.html" class="nav-item">', '<a href="admin-search.html" class="nav-item active">');

const adminSearchContent = `
        <div class="top-nav">
            <h2 style="margin:0;font-size:18px">Student Search & Analytics</h2>
            <button class="icon-btn" onclick="logout()"><i data-lucide="log-out"></i></button>
        </div>

        <div class="card mb-20">
            <h3 style="margin-top:0">Lookup Student Records</h3>
            <div style="display:flex;gap:10px;margin-top:10px">
                <input type="text" id="searchInput" placeholder="Enter student name or ID..." style="flex:1;padding:12px 16px;border-radius:12px;border:2px solid var(--border);outline:none;background:var(--bg);color:var(--text)">
                <button onclick="searchStudent()" style="background:var(--primary);color:#fff;border:none;padding:0 24px;border-radius:12px;font-weight:700;cursor:pointer">Search</button>
            </div>
        </div>

        <div id="searchResults" style="display:none">
            <div class="card mb-20" style="border-left: 4px solid var(--primary)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <h2 style="margin:0;font-size:22px" id="resName">Vedant Sharma</h2>
                        <div style="color:var(--text-muted);font-size:14px">ID: STU-99214 â€¢ Grade 11 â€¢ PCM Stream</div>
                    </div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
                <div class="card">
                    <h3 style="margin:0 0 15px 0;color:#ef4444;display:flex;align-items:center;gap:8px">
                        <i data-lucide="trending-down"></i> Weak Areas
                    </h3>
                    <ul style="padding-left:20px;color:var(--text);line-height:1.8" id="resWeak">
                        <li><strong>Mathematics:</strong> Calculus (Integral) - 30% Accuracy</li>
                        <li><strong>Physics:</strong> Rotational Mechanics - 42% Accuracy</li>
                        <li><strong>Chemistry:</strong> Organic nomenclature - 38% Accuracy</li>
                    </ul>
                </div>
                
                <div class="card">
                    <h3 style="margin:0 0 15px 0;color:#10b981;display:flex;align-items:center;gap:8px">
                        <i data-lucide="trending-up"></i> Strong Areas
                    </h3>
                    <ul style="padding-left:20px;color:var(--text);line-height:1.8" id="resStrong">
                        <li><strong>Physics:</strong> Kinematics - 91% Accuracy</li>
                        <li><strong>Mathematics:</strong> Algebra - 88% Accuracy</li>
                    </ul>
                </div>
            </div>
        </div>
    </main>
`;

let finalSearchTail = tail.replace('async function loadUserData() {', `
function searchStudent() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    if(q.trim() === '') return;
    
    // Simulate lookup
    document.getElementById('searchResults').style.display = 'block';
    
    if(q.includes('rohan')) {
        document.getElementById('resName').textContent = 'Rohan Kapoor';
        document.getElementById('resWeak').innerHTML = '<li><strong>Physics:</strong> Optics - 22% Accuracy</li><li><strong>Chem:</strong> Chemical Bonding - 19% Accuracy</li>';
    } else {
        document.getElementById('resName').textContent = 'Vedant Sharma';
    }
    lucide.createIcons();
}
async function loadUserData() {
`);

let finalSearch = adminSearchNav + adminSearchContent + finalSearchTail;
finalSearch = finalSearch.replace(/<title>.*?<\/title>/, '<title>Search â€“ AdaptEd</title>');
fs.writeFileSync(path.join(__dirname, 'admin-search.html'), finalSearch);

console.log('Admin pages created');
