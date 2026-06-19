const fs = require('fs');
let html = fs.readFileSync('login.html', 'utf8');

const newHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
    <title>Login – AdaptEd Ai</title>
    <link rel="stylesheet" href="styles.css" />
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        
        body {
            background: #F4F4F9 !important;
            font-family: 'Poppins', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            transition: background 0.5s ease;
        }
        body.admin-mode {
            background: linear-gradient(135deg, #EFEBF4 0%, #DFD5E8 100%) !important;
        }
        [data-theme="dark"] body {
            background: #0F172A !important;
        }

        .auth-card {
            background: transparent !important;
            box-shadow: none !important;
            border-radius: 32px !important;
            padding: 40px 32px !important;
            width: 100%;
            max-width: 440px;
            text-align: center;
            transition: all 0.5s ease;
        }
        
        .admin-mode .auth-card {
            background: #FFFFFF !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.06) !important;
        }

        .mascot-container {
            display: flex;
            justify-content: center;
            margin-bottom: 4px;
            position: relative;
        }
        
        .mascot {
            width: 85px;
            height: 85px;
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        @keyframes blink {
            0%, 46%, 48%, 100% { transform: scaleY(1); }
            47%, 49% { transform: scaleY(0.1); }
        }
        .mascot .eyes {
            transform-origin: 50% 51px;
            animation: blink 5s infinite;
        }

        .auth-title {
            margin-bottom: 24px;
        }

        .auth-title h3 {
            font-size: 28px !important;
            font-weight: 800 !important;
            color: #1E1B4B;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
        }
        [data-theme="dark"] .auth-title h3 {
            color: #F8FAFC;
        }
        .auth-title p {
            font-size: 15px !important;
            color: #64748B;
            font-weight: 400;
            margin: 0;
        }

        .role-switcher {
            display: flex;
            background: #FFFFFF;
            border-radius: 99px;
            padding: 6px;
            margin-bottom: 24px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.02);
            border: 1px solid #F1F5F9;
            transition: all 0.3s;
        }
        [data-theme="dark"] .role-switcher {
            background: #1E293B;
            border-color: #334155;
        }
        .admin-mode .role-switcher {
            border-color: #F8E3CD;
        }

        .role-btn {
            flex: 1;
            padding: 12px;
            border-radius: 99px;
            font-size: 15px;
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
            font-family: inherit;
        }

        .role-btn i {
            width: 18px;
            height: 18px;
        }

        .role-btn.active.student {
            background: #8A4FFF;
            color: white;
            box-shadow: 0 4px 12px rgba(138, 79, 255, 0.3);
        }

        .role-btn.active.admin {
            background: #FC7F19;
            color: white;
            box-shadow: 0 4px 12px rgba(252, 127, 25, 0.3);
        }

        .input-group {
            margin-bottom: 16px;
            text-align: left;
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
            color: #1E293B !important;
            font-family: inherit;
            transition: all 0.3s;
        }
        .input-field::placeholder {
            color: #94A3B8 !important;
            font-weight: 500;
        }
        [data-theme="dark"] .input-field {
            border-color: #334155 !important;
            color: white !important;
        }
        
        .admin-mode .input-field {
            background: #F8F7F5 !important;
            border-color: #E2E8F0 !important;
        }
        
        .input-field:focus {
            border-color: #8A4FFF !important;
            box-shadow: 0 0 0 3px rgba(138, 79, 255, 0.1) !important;
            outline: none !important;
            background: #FFFFFF !important;
        }
        .admin-mode .input-field:focus {
            border-color: #FC7F19 !important;
            box-shadow: 0 0 0 3px rgba(252, 127, 25, 0.1) !important;
            background: #FFFFFF !important;
        }

        .input-icon-left {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            width: 18px;
            height: 18px;
            color: #94A3B8;
            pointer-events: none;
            transition: color 0.3s;
        }
        .input-field:focus ~ .input-icon-left {
            color: #8A4FFF;
        }
        .admin-mode .input-field:focus ~ .input-icon-left {
            color: #FC7F19;
        }

        .input-icon-right {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            width: 18px;
            height: 18px;
            color: #94A3B8;
            cursor: pointer;
        }

        .btn-dynamic {
            background: #8A4FFF;
            color: white;
            border-radius: 99px;
            padding: 16px;
            font-size: 16px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: none;
            width: 100%;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 14px rgba(138, 79, 255, 0.3);
            font-family: inherit;
        }
        .btn-dynamic:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(138, 79, 255, 0.4);
        }
        .admin-mode .btn-dynamic {
            background: #FC7F19;
            box-shadow: 0 4px 14px rgba(252, 127, 25, 0.3);
        }
        .admin-mode .btn-dynamic:hover {
            box-shadow: 0 6px 20px rgba(252, 127, 25, 0.4);
        }
        
        .forgot-link {
            color: #8A4FFF;
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            display: inline-block;
        }
        .admin-mode .forgot-link {
            color: #FC7F19;
        }
        
        #errorMsg {
            margin-top: 0;
            margin-bottom: 16px;
            background: #FEE2E2;
            color: #DC2626;
            padding: 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
        }

        .auth-footer {
            margin-top: 24px;
            font-size: 14px;
            color: #64748B;
        }
        .auth-footer a {
            color: #8A4FFF;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
        }
        .admin-mode .auth-footer a {
            color: #FC7F19;
        }

        .mascot-shadow { fill: #E2E8F0; }
        .admin-mode .mascot-shadow { opacity: 0; }
        
        .theme-btn { display: none !important; }
    </style>
</head>
<body>
    <div class="auth-card" id="mainAuthContainer">
        <div class="mascot-container">
            <svg viewBox="0 0 100 100" class="mascot">
                <!-- Shadow -->
                <ellipse cx="50" cy="90" rx="25" ry="4" class="mascot-shadow" />
                <!-- Feet -->
                <rect x="38" y="80" width="8" height="10" rx="4" fill="#FC7F19" />
                <rect x="54" y="80" width="8" height="10" rx="4" fill="#FC7F19" />
                <!-- Body -->
                <path d="M 30 45 C 30 20, 70 20, 70 45 L 75 75 C 75 88, 25 88, 25 75 Z" fill="#FC7F19" />
                <!-- Left Leaf Hair -->
                <path d="M 50 25 C 45 20, 45 10, 50 10 C 52 15, 52 20, 50 25 Z" fill="#D95C10" />
                <!-- Right Leaf Hair -->
                <path d="M 50 25 C 55 20, 58 12, 53 12 C 53 17, 51 22, 50 25 Z" fill="#FC7F19" />
                <!-- Ears -->
                <rect x="23" y="44" width="8" height="12" rx="4" fill="#D95C10" />
                <rect x="69" y="44" width="8" height="12" rx="4" fill="#D95C10" />
                <!-- Screen Background -->
                <rect x="33" y="40" width="34" height="22" rx="10" fill="#1E293B" />
                <!-- Eyes -->
                <g class="eyes">
                    <circle cx="42" cy="51" r="3.5" fill="#FFFFFF" />
                    <circle cx="58" cy="51" r="3.5" fill="#FFFFFF" />
                </g>
            </svg>
        </div>

        <div id="errorMsg" style="display:none;"></div>

        <div class="auth-title">
            <h3 id="formTitle">Welcome Back!</h3>
            <p id="formSubtitle">Sign in to continue learning</p>
        </div>
        
        <div class="role-switcher" id="roleSwitcher">
            <button class="role-btn student active" onclick="setRole('student')">
                <i data-lucide="user"></i> Student
            </button>
            <button class="role-btn admin" onclick="setRole('admin')">
                <i data-lucide="shield"></i> Admin
            </button>
        </div>

        <div id="loginForm">
            <div class="input-group">
                <div class="input-wrapper">
                    <input id="loginEmail" class="input-field" type="email" placeholder="Email address" />
                    <i data-lucide="mail" class="input-icon-left"></i>
                </div>
            </div>
            
            <div class="input-group" style="margin-bottom: 8px;">
                <div class="input-wrapper">
                    <input id="loginPass" class="input-field" type="password" placeholder="Password" />
                    <i data-lucide="lock" class="input-icon-left"></i>
                    <i data-lucide="eye" class="input-icon-right" onclick="togglePassword('loginPass')"></i>
                </div>
            </div>
            
            <div style="text-align:right;margin-bottom:24px;">
                <a href="#" class="forgot-link">Forgot Password?</a>
            </div>
            
            <button class="btn-dynamic" onclick="handleLogin()">
                Sign In <i data-lucide="arrow-right" style="width:20px;height:20px"></i>
            </button>
            
            <div class="auth-footer">
                Don't have an account? <a onclick="toggleMode('signup')">Register</a>
            </div>
        </div>

        <div id="signupForm" style="display:none">
            <div class="input-group">
                <div class="input-wrapper">
                    <input id="signupName" class="input-field" type="text" placeholder="Full Name" />
                    <i data-lucide="user" class="input-icon-left"></i>
                </div>
            </div>
            <div class="input-group">
                <div class="input-wrapper">
                    <input id="signupEmail" class="input-field" type="email" placeholder="Email address" />
                    <i data-lucide="mail" class="input-icon-left"></i>
                </div>
            </div>
            <div class="input-group">
                <div class="input-wrapper">
                    <input id="signupPass" class="input-field" type="password" placeholder="Password" />
                    <i data-lucide="lock" class="input-icon-left"></i>
                    <i data-lucide="eye" class="input-icon-right" onclick="togglePassword('signupPass')"></i>
                </div>
            </div>
            <div class="input-group" id="examGroup" style="margin-bottom:24px;">
                <div class="input-wrapper">
                    <select id="signupExam" class="input-field" style="-webkit-appearance:none;appearance:none;">
                        <option>JEE Main / Advanced</option>
                        <option>NEET</option>
                        <option>CAT</option>
                        <option>UPSC</option>
                        <option>MHT CET</option>
                        <option>12th Boards</option>
                        <option>GATE</option>
                    </select>
                    <i data-lucide="book-open" class="input-icon-left"></i>
                </div>
            </div>
            
            <button class="btn-dynamic" onclick="handleSignup()">
                Register <i data-lucide="arrow-right" style="width:20px;height:20px"></i>
            </button>
            
            <div class="auth-footer">
                Already have an account? <a onclick="toggleMode('login')">Log In</a>
            </div>
        </div>
    </div>

    <div id="toastContainer" class="toast-container"></div>
    <script src="i18n.js"></script>
    <script src="app.js"></script>
    <script>
        const API = '';
        let currentRole = 'student';
        let currentMode = 'login';

        function setRole(role) {
            currentRole = role;
            if (role === 'admin') {
                document.body.classList.add('admin-mode');
                document.querySelectorAll('.role-btn.student').forEach(b=>b.classList.remove('active'));
                document.querySelectorAll('.role-btn.admin').forEach(b=>b.classList.add('active'));
                document.getElementById('examGroup').style.display = 'none';
            } else {
                document.body.classList.remove('admin-mode');
                document.querySelectorAll('.role-btn.admin').forEach(b=>b.classList.remove('active'));
                document.querySelectorAll('.role-btn.student').forEach(b=>b.classList.add('active'));
                document.getElementById('examGroup').style.display = 'block';
            }
        }

        function toggleMode(mode) {
            currentMode = mode;
            document.getElementById('loginForm').style.display = mode === 'login' ? 'block' : 'none';
            document.getElementById('signupForm').style.display = mode === 'signup' ? 'block' : 'none';
            document.getElementById('errorMsg').style.display = 'none';
            
            document.getElementById('formTitle').textContent = mode === 'login' ? 'Welcome Back!' : 'Create Account';
            document.getElementById('formSubtitle').textContent = mode === 'login' ? 'Sign in to continue learning' : 'Start your learning journey';
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
</body>
</html>`;
fs.writeFileSync('login.html', newHTML, 'utf8');
