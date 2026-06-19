const fs = require('fs');

let html = fs.readFileSync('login.html', 'utf8');

const newCSS = `
        /* New UI Styles */
        body {
            background: #F4F2FA !important;
        }
        [data-theme="dark"] body {
            background: #0F172A !important;
        }
        .auth-card {
            background: transparent !important;
            box-shadow: none !important;
            padding: 20px 20px !important;
        }
        
        .mascot-container {
            display: flex;
            justify-content: center;
            margin-bottom: 0px;
            position: relative;
        }
        
        .mascot {
            width: 90px;
            height: 90px;
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        @keyframes blink {
            0%, 95%, 98%, 100% { transform: scaleY(1); }
            96%, 99% { transform: scaleY(0.1); }
        }
        .mascot .eyes {
            transform-origin: 50% 55px;
            animation: blink 4s infinite;
        }

        .auth-title h3 {
            font-size: 28px !important;
            font-weight: 800 !important;
            color: #1E1B4B;
            margin-bottom: 8px;
        }
        [data-theme="dark"] .auth-title h3 {
            color: #F8FAFC;
        }
        .auth-title p {
            font-size: 15px !important;
            color: #64748B;
        }

        .role-switcher {
            display: flex;
            background: #FFFFFF;
            border-radius: 99px;
            padding: 6px;
            margin-bottom: 24px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.03);
            border: 1px solid #F1F5F9;
        }
        [data-theme="dark"] .role-switcher {
            background: #1E293B;
            border-color: #334155;
        }

        .role-btn {
            flex: 1;
            padding: 10px;
            border-radius: 99px;
            font-size: 14px;
            font-weight: 600;
            background: transparent;
            color: #64748B;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .role-btn i {
            width: 16px;
            height: 16px;
        }

        .role-btn.active.student {
            background: #7C3AED;
            color: white;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .role-btn.active.admin {
            background: #F97316;
            color: white;
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .input-group label {
            display: none; 
        }
        
        .input-wrapper {
            background: transparent;
            position: relative;
        }
        
        .input-field {
            background: transparent !important;
            border: 1px solid #E2E8F0 !important;
            border-radius: 12px !important;
            padding: 14px 16px 14px 44px !important;
            font-size: 14px !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }
        [data-theme="dark"] .input-field {
            border-color: #334155 !important;
            color: white !important;
        }
        
        .input-field:focus {
            border-color: #7C3AED !important;
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1) !important;
            outline: none !important;
        }
        .admin-theme .input-field:focus {
            border-color: #F97316 !important;
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1) !important;
        }

        .input-icon-left {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            width: 20px;
            height: 20px;
            color: #94A3B8;
        }
        .input-icon-right {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            width: 20px;
            height: 20px;
            color: #94A3B8;
            cursor: pointer;
        }

        .btn-dynamic {
            background: #7C3AED;
            color: white;
            border-radius: 99px;
            padding: 14px;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: none;
            width: 100%;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
        }
        .btn-dynamic:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
        }
        .admin-theme .btn-dynamic {
            background: #F97316;
            box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);
        }
        .admin-theme .btn-dynamic:hover {
            box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
        }
        
        .forgot-link {
            color: #7C3AED;
            font-size: 13px;
        }
        .admin-theme .forgot-link {
            color: #F97316;
        }
        
        #errorMsg {
            margin-top: 0;
            margin-bottom: 16px;
        }
`;

html = html.replace('</style>', newCSS + '\n    </style>');

const newBodyContent = `
    <button class="theme-btn" id="themeToggle"></button>

    <div class="auth-card" id="mainAuthContainer">
        <div class="mascot-container">
            <svg viewBox="0 0 100 100" class="mascot">
                <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" opacity="0.1" class="shadow-ellipse" />
                <path d="M 30 45 C 30 25, 70 25, 70 45 L 75 75 C 75 88, 25 88, 25 75 Z" fill="#F97316" />
                <path d="M 45 25 Q 50 8 55 25 Q 60 15 65 25 Q 55 35 45 25" fill="#FF9800" />
                <rect x="33" y="40" width="34" height="22" rx="10" fill="#1E293B" />
                <g class="eyes">
                    <circle cx="42" cy="51" r="3.5" fill="#FFFFFF" />
                    <circle cx="58" cy="51" r="3.5" fill="#FFFFFF" />
                </g>
                <circle cx="27" cy="51" r="4" fill="#334155" />
                <circle cx="73" cy="51" r="4" fill="#334155" />
                <rect x="23" y="48" width="6" height="6" rx="2" fill="#F97316" />
                <rect x="71" y="48" width="6" height="6" rx="2" fill="#F97316" />
                <rect x="38" y="76" width="8" height="12" rx="4" fill="#F97316" />
                <rect x="54" y="76" width="8" height="12" rx="4" fill="#F97316" />
            </svg>
        </div>

        <div id="errorMsg"></div>

        <div id="loginForm">
            <div class="auth-title">
                <h3>Welcome Back!</h3>
                <p>Sign in to continue learning</p>
            </div>
            
            <div class="role-switcher">
                <button class="role-btn student active" onclick="setRole('student')">
                    <i data-lucide="user"></i> Student
                </button>
                <button class="role-btn admin" onclick="setRole('admin')">
                    <i data-lucide="shield"></i> Admin
                </button>
            </div>

            <div class="input-group" style="margin-bottom:16px;">
                <div class="input-wrapper">
                    <i data-lucide="mail" class="input-icon-left"></i>
                    <input id="loginEmail" class="input-field" type="email" placeholder="Email address" />
                </div>
            </div>
            <div class="input-group" style="margin-bottom:12px;">
                <div class="input-wrapper">
                    <i data-lucide="lock" class="input-icon-left"></i>
                    <input id="loginPass" class="input-field" type="password" placeholder="Password" />
                    <i data-lucide="eye" class="input-icon-right" onclick="togglePassword('loginPass')"></i>
                </div>
            </div>
            <div style="text-align:right;margin-bottom:24px;">
                <a href="#" class="forgot-link">Forgot Password?</a>
            </div>
            <button class="btn-dynamic" onclick="handleLogin()">
                Sign In <i data-lucide="arrow-right" style="width:18px;height:18px"></i>
            </button>
            
            <div class="auth-footer" style="margin-top:24px">
                Don't have an account? <a onclick="toggleMode('signup')" style="color:#7C3AED;font-weight:600">Register</a>
            </div>
        </div>

        <div id="signupForm" style="display:none">
            <div class="auth-title">
                <h3>Create Account</h3>
                <p>Start your learning journey</p>
            </div>
            
            <div class="role-switcher">
                <button class="role-btn student active" onclick="setRole('student')">
                    <i data-lucide="user"></i> Student
                </button>
                <button class="role-btn admin" onclick="setRole('admin')">
                    <i data-lucide="shield"></i> Admin
                </button>
            </div>

            <div class="input-group" style="margin-bottom:16px;">
                <div class="input-wrapper">
                    <i data-lucide="user" class="input-icon-left"></i>
                    <input id="signupName" class="input-field" type="text" placeholder="Full Name" />
                </div>
            </div>
            <div class="input-group" style="margin-bottom:16px;">
                <div class="input-wrapper">
                    <i data-lucide="mail" class="input-icon-left"></i>
                    <input id="signupEmail" class="input-field" type="email" placeholder="Email address" />
                </div>
            </div>
            <div class="input-group" style="margin-bottom:16px;">
                <div class="input-wrapper">
                    <i data-lucide="lock" class="input-icon-left"></i>
                    <input id="signupPass" class="input-field" type="password" placeholder="Password" />
                    <i data-lucide="eye" class="input-icon-right" onclick="togglePassword('signupPass')"></i>
                </div>
            </div>
            <div class="input-group" style="margin-bottom:24px;">
                <div class="input-wrapper">
                    <i data-lucide="book-open" class="input-icon-left"></i>
                    <select id="signupExam" class="input-field" style="-webkit-appearance:none;appearance:none;color:#64748B;">
                        <option>JEE Main / Advanced</option>
                        <option>NEET</option>
                        <option>CAT</option>
                        <option>UPSC</option>
                        <option>MHT CET</option>
                        <option>12th Boards</option>
                        <option>GATE</option>
                    </select>
                </div>
            </div>
            
            <button class="btn-dynamic" onclick="handleSignup()">
                Register <i data-lucide="arrow-right" style="width:18px;height:18px"></i>
            </button>
            
            <div class="auth-footer" style="margin-top:24px">
                Already have an account? <a onclick="toggleMode('login')" style="color:#7C3AED;font-weight:600">Log In</a>
            </div>
        </div>
    </div>

    <div id="toastContainer" class="toast-container"></div>
    <script src="i18n.js"></script>
    <script src="app.js"></script>
    <script>
        const API = '';
        let currentRole = 'student';

        function setRole(role) {
            currentRole = role;
            const container = document.getElementById('mainAuthContainer');
            if (role === 'admin') {
                container.classList.add('admin-theme');
                document.querySelectorAll('.role-btn.student').forEach(b=>b.classList.remove('active'));
                document.querySelectorAll('.role-btn.admin').forEach(b=>b.classList.add('active'));
                document.getElementById('signupExam').style.display = 'none';
            } else {
                container.classList.remove('admin-theme');
                document.querySelectorAll('.role-btn.admin').forEach(b=>b.classList.remove('active'));
                document.querySelectorAll('.role-btn.student').forEach(b=>b.classList.add('active'));
                document.getElementById('signupExam').style.display = 'block';
            }
        }

        function toggleMode(mode) {
            document.getElementById('loginForm').style.display = mode === 'login' ? 'block' : 'none';
            document.getElementById('signupForm').style.display = mode === 'signup' ? 'block' : 'none';
            document.getElementById('errorMsg').style.display = 'none';
        }

        function togglePassword(id) {
            const input = document.getElementById(id);
            if (input.type === 'password') {
                input.type = 'text';
            } else {
                input.type = 'password';
            }
        }

        function showError(msg) {
            const el = document.getElementById('errorMsg');
            el.textContent = msg;
            el.style.display = 'block';
        }

        async function handleLogin() {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPass').value;
            if (!email || !password) { showError('Please fill in all fields'); return; }
            try {
                const res = await fetch(API + '/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Login failed');
                localStorage.setItem('ls-token', data.token);
                localStorage.setItem('ls-user', JSON.stringify(data.user));
                Toast.show('Welcome back! Redirecting...', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 800);
            } catch (err) {
                showError(err.message);
            }
        }

        async function handleSignup() {
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPass').value;
            const exam = document.getElementById('signupExam').value;
            if (!name || !email || !password) { showError('Please fill in all fields'); return; }
            if (password.length < 6) { showError('Password must be at least 6 characters'); return; }
            try {
                const res = await fetch(API + '/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, exam: currentRole === 'admin' ? 'Admin' : exam })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Signup failed');
                localStorage.setItem('ls-token', data.token);
                localStorage.setItem('ls-user', JSON.stringify(data.user));
                Toast.show('Account created! Welcome! 🎉', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 800);
            } catch (err) {
                showError(err.message);
            }
        }

        document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
        document.getElementById('signupPass').addEventListener('keydown', e => { if (e.key === 'Enter') handleSignup(); });

        lucide.createIcons();
    </script>
</body>`;

html = html.replace(/<button class="theme-btn" id="themeToggle"><\/button>[\s\S]*<\/body>/, newBodyContent);

fs.writeFileSync('login.html', html, 'utf8');
