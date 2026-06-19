const fs = require('fs');

let html = fs.readFileSync('login.html', 'utf8');

// We will adapt login.html to create a signup.html
// 1. Change title
html = html.replace('<title>Login - AdaptEd Ai</title>', '<title>Sign Up - AdaptEd Ai</title>');

// 2. Change Welcome Back! to "Create Account"
html = html.replace('<h1 class="heading">Welcome Back!</h1>', '<h1 class="heading">Create Account</h1>');
html = html.replace('<p class="subheading">Sign in to continue learning</p>', '<p class="subheading">Start your learning journey</p>');

// 3. Modify form ID and inner fields
const oldForm = `<form id="loginForm" novalidate>
            <div class="fields">
                <label class="field">
                    <i data-lucide="mail" class="field-icon"></i>
                    <input id="loginEmail" type="email" autocomplete="email" placeholder="Email address" required />
                </label>

                <label class="field">
                    <i data-lucide="lock" class="field-icon"></i>
                    <input id="loginPass" type="password" autocomplete="current-password" placeholder="Password" required />
                    <button type="button" class="toggle-pass" id="togglePass" aria-label="Show password">
                        <i data-lucide="eye"></i>
                    </button>
                </label>
            </div>

            <div class="forgot-row">
                <a href="#">Forgot Password?</a>
            </div>

            <button class="auth-btn" type="submit">
                Sign In
                <i data-lucide="arrow-right" style="width:30px;height:30px"></i>
            </button>
        </form>`;

const newForm = `<form id="signupForm" novalidate>
            <div class="fields">
                <label class="field">
                    <i data-lucide="user" class="field-icon"></i>
                    <input id="signupName" type="text" autocomplete="name" placeholder="Full Name" required />
                </label>
            
                <label class="field">
                    <i data-lucide="mail" class="field-icon"></i>
                    <input id="signupEmail" type="email" autocomplete="email" placeholder="Email address" required />
                </label>

                <label class="field">
                    <i data-lucide="lock" class="field-icon"></i>
                    <input id="signupPass" type="password" autocomplete="new-password" placeholder="Password (6+ chars)" required />
                    <button type="button" class="toggle-pass" id="togglePass" aria-label="Show password">
                        <i data-lucide="eye"></i>
                    </button>
                </label>

                <label class="field" id="examField">
                    <i data-lucide="book-open" class="field-icon"></i>
                    <select id="signupExam" required style="width: 100%; height: 64px; border-radius: 19px; border: 1.6px solid var(--field-border); background: linear-gradient(140deg, var(--field-grad-start) 0%, var(--field-grad-end) 100%); color: var(--ink-900); font-size: 1.03rem; padding: 0 50px; font-family: Outfit, sans-serif; transition: border-color 210ms ease, box-shadow 210ms ease, transform 210ms ease; -webkit-appearance: none; appearance: none; cursor: pointer;">
                        <option value="" disabled selected hidden style="color: var(--ink-500);">Target Exam</option>
                        <option>JEE Main / Advanced</option>
                        <option>NEET</option>
                        <option>CAT</option>
                        <option>UPSC</option>
                        <option>MHT CET</option>
                        <option>12th Boards</option>
                        <option>GATE</option>
                    </select>
                </label>
            </div>

            <button class="auth-btn" type="submit" style="margin-top:20px;">
                Register
                <i data-lucide="arrow-right" style="width:30px;height:30px"></i>
            </button>
        </form>`;

html = html.replace(oldForm, newForm);

// 5. Change foot-note
const oldFooter = `<p class="foot-note">
            Don't have an account?
            <a href="signup.html">Register</a>
        </p>`;

const newFooter = `<p class="foot-note">
            Already have an account?
            <a href="login.html">Log In</a>
        </p>`;

html = html.replace(oldFooter, newFooter);

// 6. Update the scripts entirely
let scriptStart = html.indexOf('<script>');
html = html.substring(0, scriptStart);

const newScripts = `<script>
        const API = '';

        function showError(msg) {
            const el = document.getElementById('errorMsg');
            el.textContent = msg;
            el.style.display = 'block';
        }

        function clearError() {
            const el = document.getElementById('errorMsg');
            el.style.display = 'none';
            el.textContent = '';
        }

        async function handleSignup() {
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPass').value;
            const examSelect = document.getElementById('signupExam');
            const exam = examSelect.value;
            
            const role = document.getElementById('roleSwitch').dataset.mode;

            clearError();
            if (!name || !email || !password) {
                showError('Please fill in Name, Email and Password');
                return;
            }
            if (password.length < 6) {
                showError('Password must be at least 6 characters');
                return;
            }
            if (role === 'student' && !exam) {
                showError('Please select a target exam');
                return;
            }

            try {
                const res = await fetch(API + '/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, exam: role === 'admin' ? 'Admin' : exam })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Signup failed');

                localStorage.setItem('ls-token', data.token);
                localStorage.setItem('ls-user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } catch (err) {
                showError(err.message || 'Unable to signup right now');
            }
        }

        function bindRoleSwitch() {
            const switcher = document.getElementById('roleSwitch');
            const examField = document.getElementById('examField');
            const applyRoleTheme = (mode) => {
                document.body.setAttribute('data-role', mode);
                switcher.dataset.mode = mode;
                if (mode === 'admin') {
                    examField.style.display = 'none';
                } else {
                    examField.style.display = 'block';
                }
            };

            document.getElementById('studentBtn').addEventListener('click', () => {
                applyRoleTheme('student');
            });
            document.getElementById('adminBtn').addEventListener('click', () => {
                applyRoleTheme('admin');
            });

            applyRoleTheme('student');
        }

        function bindPasswordToggle() {
            const input = document.getElementById('signupPass');
            const btn = document.getElementById('togglePass');
            btn.addEventListener('click', () => {
                const shown = input.type === 'text';
                input.type = shown ? 'password' : 'text';
                btn.innerHTML = shown ? '<i data-lucide="eye"></i>' : '<i data-lucide="eye-off"></i>';
                lucide.createIcons();
            });
        }

        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSignup();
        });

        document.querySelectorAll('input, select').forEach((el) => {
            el.addEventListener('input', clearError);
            el.addEventListener('change', clearError);
        });

        bindRoleSwitch();
        bindPasswordToggle();
        lucide.createIcons();
    </script>
</body>
</html>`;

html += newScripts;

fs.writeFileSync('signup.html', html, 'utf8');
