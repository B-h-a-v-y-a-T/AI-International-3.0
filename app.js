/* =====================================================
   AdaptEd Ai – Shared App Logic
===================================================== */

// ─── Shared Storage Bridge (Data Agent first, local fallback) ───────────────
function readSharedData(key, fallback = null) {
    try {
        if (window.DataAgent && typeof window.DataAgent.readCompat === 'function') {
            const value = window.DataAgent.readCompat(key, fallback);
            return value === undefined ? fallback : value;
        }

        const raw = localStorage.getItem(key);
        if (raw === null || raw === undefined) return fallback;
        if (typeof fallback === 'string') return raw;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function writeSharedData(key, value) {
    try {
        if (window.DataAgent && typeof window.DataAgent.writeCompat === 'function') {
            window.DataAgent.writeCompat(key, value);
            return;
        }

        if (typeof value === 'string') {
            localStorage.setItem(key, value);
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    } catch { }
}

// ─── Theme Management ───────────────────────────────
const ThemeManager = {
    init() {
        const saved = readSharedData('ls-theme', 'light') || 'light';
        this.apply(saved);
    },
    apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        writeSharedData('ls-theme', theme);
        const btn = document.getElementById('themeToggle');
        const sunSVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #374151;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
        const moonSVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #374151;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
        if (btn) btn.innerHTML = theme === 'dark' ? sunSVG : moonSVG;
    },
    toggle() {
        const cur = document.documentElement.getAttribute('data-theme') || 'light';
        this.apply(cur === 'dark' ? 'light' : 'dark');
    }
};

// ─── Sidebar Active Link ────────────────────────────
function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        el.classList.toggle('active', el.dataset.page === path);
    });
}

// ─── Toast Notifications ────────────────────────────
const Toast = {
    container: null,
    init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.id = 'toastContainer';
            document.body.appendChild(this.container);
        }
    },
    show(msg, type = 'info', duration = 3500) {
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        const icons = { success: '🎉', warning: '⚠️', info: '💡' };
        t.innerHTML = `
      <div style="display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:18px">${icons[type] || '💬'}</span>
        <span style="font-size:13px;line-height:1.5">${msg}</span>
      </div>`;
        this.container.appendChild(t);
        setTimeout(() => {
            t.style.animation = 'toastSlideOut 0.3s forwards';
            setTimeout(() => t.remove(), 300);
        }, duration);
    }
};

// ─── Emotion Pills ──────────────────────────────────
const EmotionColors = {
    Confident: { bg: 'rgba(110,231,183,0.15)', color: '#10B981', emoji: '😊' },
    Confused: { bg: 'rgba(252,211,77,0.15)', color: '#D97706', emoji: '🤔' },
    Frustrated: { bg: 'rgba(252,165,165,0.15)', color: '#EF4444', emoji: '😤' },
    Anxious: { bg: 'rgba(167,139,250,0.15)', color: '#7C3AED', emoji: '😰' },
    Neutral: { bg: 'rgba(148,163,184,0.15)', color: '#64748B', emoji: '😐' },
};

function setEmotion(name) {
    const tag = document.getElementById('emotionTag');
    if (!tag) return;
    const e = EmotionColors[name] || EmotionColors.Neutral;
    tag.style.background = e.bg;
    tag.style.color = e.color;
    tag.style.borderColor = e.color + '44';
    tag.innerHTML = `${e.emoji} ${name}`;
}

// ─── Progress Animation ─────────────────────────────
function animateProgress(el, target) {
    if (!el) return;
    let cur = 0;
    const step = () => {
        cur = Math.min(cur + 1.5, target);
        el.style.width = cur + '%';
        if (cur < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

// ─── Countdown Timer ────────────────────────────────
function startTimer(el, seconds, onDone) {
    if (!el) return;
    let rem = seconds;
    const update = () => {
        const m = Math.floor(rem / 60);
        const s = rem % 60;
        el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        if (rem <= 0) { onDone && onDone(); return; }
        rem--;
        setTimeout(update, 1000);
    };
    update();
}

// ─── Fake Typing Effect ──────────────────────────────
function typeText(el, text, speed = 28, cb) {
    let i = 0;
    el.textContent = '';
    const type = () => {
        if (i < text.length) {
            el.textContent += text[i++];
            setTimeout(type, speed);
        } else { cb && cb(); }
    };
    type();
}

// ─── Study Activity Tracker (localStorage-backed) ────
const StudyTracker = {
    STORAGE_KEY: 'ls-study-activity',

    /** Get all activity data as { "YYYY-MM-DD": questionsSolved, ... } */
    getAll() {
        return readSharedData(this.STORAGE_KEY, {});
    },

    /** Get today's date string in YYYY-MM-DD */
    _dateKey(date) {
        const d = date || new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    },

    /**
     * Log solved questions for today.
     * @param {number} count – number of questions solved in this session
     */
    logSubmission(count) {
        const data = this.getAll();
        const key = this._dateKey();
        data[key] = (data[key] || 0) + count;
        writeSharedData(this.STORAGE_KEY, data);
    },

    /** Return the solve count for a specific Date object */
    getCount(date) {
        return this.getAll()[this._dateKey(date)] || 0;
    },

    /**
     * Map a daily solve-count to an intensity level 0-3.
     *   0 → no activity
     *   1 → 1-3  questions  (less)
     *   2 → 4-8  questions  (medium)
     *   3 → 9+   questions  (more)
     */
    level(count) {
        if (count <= 0) return 0;
        if (count <= 3) return 1;
        if (count <= 8) return 2;
        return 3;
    }
};

// ─── Exam Manager ────────────────────────────────────
const ExamManager = {
    STORAGE_KEY: 'ls-exam',
    get() { return readSharedData(this.STORAGE_KEY, 'JEE') || 'JEE'; },
    set(exam) { writeSharedData(this.STORAGE_KEY, String(exam || 'JEE')); }
};

// ─── Adaptive Quiz Engine ─────────────────────────────
function _shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

const QuizEngine = {
    STORAGE_KEY: 'ls-quiz-perf',

    getPerf() {
        return readSharedData(this.STORAGE_KEY, {});
    },
    savePerf(p) { writeSharedData(this.STORAGE_KEY, p || {}); },

    getTopicPerf(topic) {
        return this.getPerf()[topic] || { ema: 0.5, attempts: 0, wrongIds: [] };
    },

    /**
     * Update EMA accuracy for a topic after a quiz session.
     * Uses exponential moving average (α = 0.35) so recent performance matters more.
     */
    updatePerf(topic, correct, total, wrongIds) {
        if (total === 0) return;
        const perf = this.getPerf();
        const t = perf[topic] || { ema: 0.5, attempts: 0, wrongIds: [] };
        const acc = correct / total;
        t.ema = t.attempts === 0 ? acc : 0.65 * t.ema + 0.35 * acc;
        t.attempts += total;
        // Keep last 20 wrong question IDs for priority re-selection
        t.wrongIds = [...new Set([...wrongIds, ...(t.wrongIds || [])])].slice(0, 20);
        perf[topic] = t;
        this.savePerf(perf);
    },

    /**
     * Determine difficulty tier for a topic based on stored EMA accuracy.
     *   < 5 attempts  → medium (warm-up phase)
     *   ema ≥ 0.78    → hard
     *   ema ≤ 0.42    → easy
     *   otherwise     → medium
     */
    getDifficulty(topic) {
        const { ema, attempts } = this.getTopicPerf(topic);
        if (attempts < 5) return 'medium';
        if (ema >= 0.78) return 'hard';
        if (ema <= 0.42) return 'easy';
        return 'medium';
    },

    /**
     * MAB-based Selection (Bandit Algorithm)
     * Exploration (20-30%): New or completely random topics/questions (to identify hidden weaknesses).
     * Exploitation (70-80%): Focus heavily on predefined `weakTopics` and previously failed `wrongIds`.
     */
    selectQuestions(bank, topic, count, mixedTopics) {
        const topics = topic === 'Mixed'
            ? (mixedTopics || ['Physics', 'Chemistry', 'Maths', 'Biology'])
            : [topic];

        const state = readSharedData('userState', null);
        const weak = state?.weakTopics || [];

        let exploitationPool = [];
        let explorationPool = [];

        topics.forEach(t => {
            const diff = this.getDifficulty(t);
            const { wrongIds } = this.getTopicPerf(t);
            const tqs = bank.filter(q => q.topic === t);
            
            const wSet = new Set(wrongIds || []);
            const wrongQs = _shuffle(tqs.filter(q => wSet.has(q.id)));
            const unseenQs = _shuffle(tqs.filter(q => !wSet.has(q.id)));

            // If it's a weak topic or specific topic was requested (Exploit)
            if (topic !== 'Mixed' || weak.includes(t)) {
                exploitationPool.push(...wrongQs, ...unseenQs.filter(q => q.difficulty === diff));
                // Add rest of the unseen qs to exploration
                explorationPool.push(...unseenQs.filter(q => q.difficulty !== diff));
            } else {
                // Strong/Neutral/Unseen topic (Explore)
                explorationPool.push(...wrongQs, ...unseenQs);
            }
        });

        exploitationPool = _shuffle(exploitationPool);
        explorationPool = _shuffle(explorationPool);

        // Bandit Split: ~80% Exploit / 20% Explore
        const exploitCount = Math.floor(count * 0.8);
        const selected = [];

        if (exploitationPool.length >= exploitCount) {
            selected.push(...exploitationPool.splice(0, exploitCount));
        } else {
            selected.push(...exploitationPool);
        }

        const remaining = count - selected.length;
        if (explorationPool.length >= remaining) {
            selected.push(...explorationPool.splice(0, remaining));
        } else {
            selected.push(...explorationPool);
            const stillRemaining = count - selected.length;
            if (stillRemaining > 0) selected.push(...exploitationPool.splice(0, stillRemaining));
        }

        return _shuffle(selected).slice(0, count);
    }
};

// ─── Exam Engine ─────────────────────────────────────
const ExamEngine = {
    EXAMS: {
        'JEE': { fullName: 'JEE Main', icon: '⚡', durationMin: 180, sections: [{ subject: 'Physics', count: 25, marks: 4, negative: -1 }, { subject: 'Chemistry', count: 25, marks: 4, negative: -1 }, { subject: 'Maths', count: 25, marks: 4, negative: -1 }] },
        'NEET': { fullName: 'NEET UG', icon: '🧬', durationMin: 200, sections: [{ subject: 'Physics', count: 6, marks: 4, negative: -1 }, { subject: 'Chemistry', count: 6, marks: 4, negative: -1 }, { subject: 'Biology', count: 13, marks: 4, negative: -1 }] },
        'CAT': { fullName: 'CAT', icon: '📊', durationMin: 120, sections: [{ subject: 'VARC', count: 7, marks: 3, negative: -1 }, { subject: 'DILR', count: 7, marks: 3, negative: -1 }, { subject: 'QA', count: 6, marks: 3, negative: -1 }] },
        'UPSC': { fullName: 'UPSC Prelims', icon: '🏛️', durationMin: 120, sections: [{ subject: 'History & Polity', count: 7, marks: 2, negative: -0.67 }, { subject: 'Geography', count: 7, marks: 2, negative: -0.67 }, { subject: 'Economy & Environment', count: 6, marks: 2, negative: -0.67 }] },
        'MHT CET': { fullName: 'MHT CET', icon: '🎯', durationMin: 180, sections: [{ subject: 'Physics', count: 8, marks: 2, negative: 0 }, { subject: 'Chemistry', count: 8, marks: 2, negative: 0 }, { subject: 'Maths', count: 9, marks: 2, negative: 0 }] },
        'GATE': { fullName: 'GATE CSE', icon: '🔬', durationMin: 180, sections: [{ subject: 'Engineering Maths', count: 7, marks: 2, negative: -0.67 }, { subject: 'General Aptitude', count: 6, marks: 1, negative: -0.33 }, { subject: 'CSE Core', count: 7, marks: 2, negative: -0.67 }] },
    },
    SESSION_KEY: 'ls-exam-session',
    HISTORY_KEY: 'ls-exam-history',

    getConfig(exam) { return this.EXAMS[exam] || this.EXAMS['JEE']; },
    totalQ(exam) { return (this.getConfig(exam).sections || []).reduce((s, x) => s + x.count, 0); },

    saveSession(s) { try { sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(s)); } catch { } },
    getSession() { try { return JSON.parse(sessionStorage.getItem(this.SESSION_KEY)) || null; } catch { return null; } },
    clearSession() { sessionStorage.removeItem(this.SESSION_KEY); },

    saveHistory(r) {
        let h = readSharedData(this.HISTORY_KEY, []);
        h.push({ ...r, ts: Date.now() });
        if (h.length > 30) h = h.slice(-30);
        writeSharedData(this.HISTORY_KEY, h);
    },
    getHistory() { return readSharedData(this.HISTORY_KEY, []); },

    /** Analyse a completed session, return marks, pct, per-subject breakdown, weak topics */
    analyzeResult(session) {
        const { exam, questions, answers } = session;
        const cfg = this.getConfig(exam);
        let totalMarks = 0, maxMarks = 0;
        const subStats = {};

        questions.forEach((q, i) => {
            const sec = cfg.sections.find(s => s.subject === q.subject) || cfg.sections[0];
            maxMarks += sec.marks;
            const sub = q.subject, top = q.topic || 'General';
            if (!subStats[sub]) subStats[sub] = { correct: 0, wrong: 0, skipped: 0, topics: {} };
            if (!subStats[sub].topics[top]) subStats[sub].topics[top] = { correct: 0, total: 0 };
            subStats[sub].topics[top].total++;
            const ans = (answers && answers[i] !== undefined) ? answers[i] : -1;
            if (ans === -1) { subStats[sub].skipped++; }
            else if (ans === q.correct) {
                subStats[sub].correct++;
                subStats[sub].topics[top].correct++;
                totalMarks += sec.marks;
            } else {
                subStats[sub].wrong++;
                totalMarks += sec.negative;
            }
        });

        const weakTopics = [];
        Object.entries(subStats).forEach(([sub, st]) => {
            Object.entries(st.topics).forEach(([topic, ts]) => {
                const acc = ts.total > 0 ? Math.round(ts.correct / ts.total * 100) : 0;
                if (acc < 50) weakTopics.push({ subject: sub, topic, accuracy: acc, total: ts.total });
            });
        });
        weakTopics.sort((a, b) => a.accuracy - b.accuracy);

        return {
            totalMarks: Math.max(0, totalMarks),
            maxMarks,
            pct: maxMarks > 0 ? Math.max(0, Math.round(totalMarks / maxMarks * 100)) : 0,
            subStats,
            weakTopics
        };
    }
};

// ─── Random Encouragement ────────────────────────────
const encouragements = [
    "You're on fire! 🔥 Keep going!",
    "Great job! Every question counts 💪",
    "That's the spirit! 🚀",
    "Consistency is the key! 🗝️",
    "You're building a habit! Keep going 💪",
    "Amazing streak! Don't break it 🏆",
];
function getEncouragement() {
    return encouragements[Math.floor(Math.random() * encouragements.length)];
}

// ─── Cross-Page Focus Session Guard ─────────────────
const FocusSessionBridge = (() => {
    const STORAGE_KEY = 'ls-focus-session-v1';
    const INTERNAL_NAV_KEY = 'ls-focus-internal-nav-ts';
    const INTERNAL_NAV_GRACE_MS = 1200;
    const MINI_CLOCK_ID = 'focusMiniClock';
    const FULLSCREEN_GATE_ID = 'focusFullscreenGate';
    const LEAVE_CLASS = 'focus-page-leaving';
    let ticker = null;
    let fullscreenRetryBound = false;

    function readSession() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
        } catch {
            return null;
        }
    }

    function writeSession(session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    function clearSession() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function markInternalNavigation() {
        try {
            sessionStorage.setItem(INTERNAL_NAV_KEY, String(Date.now()));
        } catch {
            // Ignore storage errors in strict/private environments
        }
    }

    function clearInternalNavigationIntent() {
        try {
            sessionStorage.removeItem(INTERNAL_NAV_KEY);
        } catch {
            // Ignore storage errors in strict/private environments
        }
    }

    function isInternalNavigationRecent() {
        try {
            const ts = Number(sessionStorage.getItem(INTERNAL_NAV_KEY) || 0);
            return ts > 0 && (Date.now() - ts) <= INTERNAL_NAV_GRACE_MS;
        } catch {
            return false;
        }
    }

    function isSessionActive(session) {
        return Boolean(
            session &&
            session.active &&
            session.isRunning &&
            Number(session.endTime) > Date.now()
        );
    }

    function formatRemaining(seconds) {
        const safe = Math.max(0, Math.floor(seconds));
        const hrs = Math.floor(safe / 3600);
        const mins = Math.floor((safe % 3600) / 60);
        const secs = safe % 60;
        if (hrs > 0) {
            return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function ensureMiniClock() {
        let el = document.getElementById(MINI_CLOCK_ID);
        if (el) return el;

        el = document.createElement('button');
        el.id = MINI_CLOCK_ID;
        el.type = 'button';
        el.className = 'focus-mini-clock';
        el.innerHTML = `
            <span class="focus-mini-clock-icon" aria-hidden="true">⏱</span>
            <span class="focus-mini-clock-time">00:00</span>
        `;
        el.title = 'Focus timer is running. Click to open Focus Mode.';
        el.addEventListener('click', () => {
            markInternalNavigation();
            document.body.classList.add(LEAVE_CLASS);
            window.location.href = 'focus.html';
        });
        document.body.appendChild(el);
        return el;
    }

    function ensureFullscreenGate() {
        let el = document.getElementById(FULLSCREEN_GATE_ID);
        if (el) return el;

        el = document.createElement('div');
        el.id = FULLSCREEN_GATE_ID;
        el.className = 'focus-fullscreen-gate';
        // Inline fallback styles ensure gate still works even if page CSS is stale/overridden.
        Object.assign(el.style, {
            position: 'fixed',
            inset: '0',
            zIndex: '2147483647',
            display: 'none',
            placeItems: 'center',
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            pointerEvents: 'none',
            cursor: 'pointer'
        });
        el.innerHTML = `
            <div class="focus-fullscreen-gate-card">
                <div class="focus-fullscreen-gate-title">Focus Mode Active</div>
                <div class="focus-fullscreen-gate-text">Tap anywhere to restore fullscreen and continue focus.</div>
                <div class="focus-fullscreen-gate-time" id="focusFullscreenGateTime">00:00</div>
                <button type="button" class="focus-fullscreen-gate-btn" id="focusFullscreenGateBtn">Restore Fullscreen</button>
            </div>
        `;

        const card = el.querySelector('.focus-fullscreen-gate-card');
        if (card) {
            Object.assign(card.style, {
                width: 'min(92vw, 340px)',
                background: '#ffffff',
                border: '2px solid #1e1e1e',
                borderRadius: '16px',
                boxShadow: '4px 4px 0px #1e1e1e',
                padding: '16px',
                textAlign: 'center'
            });
        }

        const title = el.querySelector('.focus-fullscreen-gate-title');
        if (title) {
            Object.assign(title.style, {
                fontSize: '14px',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '6px'
            });
        }

        const text = el.querySelector('.focus-fullscreen-gate-text');
        if (text) {
            Object.assign(text.style, {
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '10px'
            });
        }

        const time = el.querySelector('.focus-fullscreen-gate-time');
        if (time) {
            Object.assign(time.style, {
                fontSize: '18px',
                fontWeight: '800',
                color: '#6CA8F1',
                marginBottom: '10px',
                fontVariantNumeric: 'tabular-nums'
            });
        }

        const button = el.querySelector('.focus-fullscreen-gate-btn');
        if (button) {
            Object.assign(button.style, {
                width: '100%',
                border: '2px solid #1e1e1e',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #6CA8F1 0%, #A78BFA 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                padding: '10px 12px',
                cursor: 'pointer'
            });
        }

        let restoring = false;
        const tryRestore = async () => {
            if (restoring) return;
            restoring = true;
            const session = readSession();
            if (!isSessionActive(session)) {
                hideFullscreenGate();
                restoring = false;
                return;
            }
            try {
                await document.documentElement.requestFullscreen();
                hideFullscreenGate();
            } catch {
                // User activation may still be required; keep gate visible.
            } finally {
                restoring = false;
            }
        };

        const btn = el.querySelector('#focusFullscreenGateBtn');
        if (btn) btn.addEventListener('click', (event) => {
            event.stopPropagation();
            tryRestore();
        });

        // Capture the first tap/click anywhere on the gate and use it to restore fullscreen.
        el.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            tryRestore();
        }, true);

        document.body.appendChild(el);
        return el;
    }

    function showFullscreenGate(remainingSeconds) {
        const el = ensureFullscreenGate();
        const timeEl = el.querySelector('#focusFullscreenGateTime');
        if (timeEl && Number.isFinite(remainingSeconds)) {
            timeEl.textContent = formatRemaining(remainingSeconds);
        }
        el.style.display = 'grid';
        el.style.pointerEvents = 'auto';
        el.classList.add('visible');
    }

    function hideFullscreenGate() {
        const el = document.getElementById(FULLSCREEN_GATE_ID);
        if (!el) return;
        el.style.display = 'none';
        el.style.pointerEvents = 'none';
        el.classList.remove('visible');
    }

    function hideMiniClock() {
        const el = document.getElementById(MINI_CLOCK_ID);
        if (!el) return;
        el.classList.remove('visible');
    }

    function renderMiniClock(remainingSeconds) {
        const el = ensureMiniClock();
        const timeEl = el.querySelector('.focus-mini-clock-time');
        if (timeEl) {
            timeEl.textContent = formatRemaining(remainingSeconds);
        }
        el.classList.add('visible');
    }

    function smoothNavigateTo(url) {
        document.body.classList.add(LEAVE_CLASS);
        // Navigate immediately to preserve user activation as much as possible.
        window.location.href = url;
    }

    function stopSession(reason) {
        clearSession();
        document.body.classList.remove(LEAVE_CLASS);
        hideMiniClock();
        hideFullscreenGate();
        if (ticker) {
            clearInterval(ticker);
            ticker = null;
        }

        if (typeof Toast !== 'undefined' && Toast && typeof Toast.show === 'function') {
            const msg = reason === 'tab-hidden'
                ? 'Focus mode ended because you left the tab.'
                : 'Focus timer reset because fullscreen was exited.';
            Toast.show(msg, 'warning', 3200);
        }
    }

    function refreshSessionClock() {
        const session = readSession();
        if (!isSessionActive(session)) {
            if (session && session.active && session.isRunning && Number(session.endTime) <= Date.now()) {
                clearSession();
            }
            hideMiniClock();
            hideFullscreenGate();
            if (ticker) {
                clearInterval(ticker);
                ticker = null;
            }
            return;
        }

        const remaining = Math.max(0, Math.ceil((Number(session.endTime) - Date.now()) / 1000));
        if (remaining <= 0) {
            clearSession();
            hideMiniClock();
            hideFullscreenGate();
            if (ticker) {
                clearInterval(ticker);
                ticker = null;
            }
            return;
        }

        writeSession({
            ...session,
            remainingSeconds: remaining,
            updatedAt: Date.now()
        });
        renderMiniClock(remaining);
        if (!document.fullscreenElement) {
            showFullscreenGate(remaining);
        } else {
            hideFullscreenGate();
        }
    }

    function bindFullscreenRetryOnInteraction() {
        if (fullscreenRetryBound) return;

        const retryFullscreen = async () => {
            const session = readSession();
            if (!isSessionActive(session)) {
                unbindRetry();
                return;
            }
            if (document.fullscreenElement) {
                unbindRetry();
                return;
            }

            try {
                await document.documentElement.requestFullscreen();
                hideFullscreenGate();
                unbindRetry();
            } catch {
                // Keep retry handlers; next user interaction can try again.
            }
        };

        const unbindRetry = () => {
            if (!fullscreenRetryBound) return;
            fullscreenRetryBound = false;
            window.removeEventListener('pointerdown', retryFullscreen, true);
            window.removeEventListener('keydown', retryFullscreen, true);
            window.removeEventListener('touchstart', retryFullscreen, true);
        };

        fullscreenRetryBound = true;
        window.addEventListener('pointerdown', retryFullscreen, true);
        window.addEventListener('keydown', retryFullscreen, true);
        window.addEventListener('touchstart', retryFullscreen, true);
    }

    async function enforceFullscreenOrStop() {
        const session = readSession();
        if (!isSessionActive(session)) return;
        if (document.fullscreenElement) {
            hideFullscreenGate();
            return;
        }

        try {
            await document.documentElement.requestFullscreen();
            hideFullscreenGate();
        } catch {
            // Navigation across documents can drop fullscreen without user intent.
            // Keep timer alive and retry fullscreen on next direct user interaction.
            showFullscreenGate(session.remainingSeconds || Math.ceil((Number(session.endTime) - Date.now()) / 1000));
            bindFullscreenRetryOnInteraction();
        }
    }

    function scheduleFullscreenRestore() {
        const session = readSession();
        if (!isSessionActive(session)) return;
        if (document.fullscreenElement) {
            hideFullscreenGate();
            return;
        }
        showFullscreenGate(session.remainingSeconds || Math.ceil((Number(session.endTime) - Date.now()) / 1000));
        enforceFullscreenOrStop();
    }

    function bindInternalNavigationTracking() {
        document.addEventListener('click', (event) => {
            if (event.defaultPrevented || event.button !== 0) return;
            const link = event.target.closest('a[href]');
            if (!link) return;
            if (link.target && link.target !== '_self') return;
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            if (link.hasAttribute('download')) return;

            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

            try {
                const targetUrl = new URL(href, window.location.href);
                if (targetUrl.origin === window.location.origin) {
                    markInternalNavigation();

                    const session = readSession();
                    if (!isSessionActive(session)) return;

                    const currentPage = `${window.location.origin}${window.location.pathname}${window.location.search}`;
                    const targetPage = `${targetUrl.origin}${targetUrl.pathname}${targetUrl.search}`;
                    if (currentPage === targetPage) return;

                    event.preventDefault();
                    smoothNavigateTo(targetUrl.href);
                }
            } catch {
                // Ignore malformed links
            }
        }, true);
    }

    function bindSessionGuards() {
        document.addEventListener('visibilitychange', () => {
            const session = readSession();
            if (!isSessionActive(session)) return;
            if (document.hidden && !isInternalNavigationRecent()) {
                stopSession('tab-hidden');
            } else if (!document.hidden) {
                scheduleFullscreenRestore();
            }
        });

        document.addEventListener('fullscreenchange', () => {
            const session = readSession();
            if (!isSessionActive(session)) return;
            if (document.fullscreenElement) {
                hideFullscreenGate();
                return;
            }
            // On non-focus pages, fullscreen may drop during navigation.
            // Keep focus session alive and restore fullscreen instead of stopping here.
            scheduleFullscreenRestore();
        });

        window.addEventListener('pageshow', () => {
            scheduleFullscreenRestore();
        });

        window.addEventListener('focus', () => {
            scheduleFullscreenRestore();
        });
    }

    function init() {
        // Clear navigation intent shortly after page boot so navigation-related
        // fullscreen transitions are still treated as intentional.
        setTimeout(() => {
            clearInternalNavigationIntent();
        }, INTERNAL_NAV_GRACE_MS + 100);

        bindInternalNavigationTracking();
        bindSessionGuards();

        const session = readSession();
        if (!isSessionActive(session)) {
            if (session && session.active && session.isRunning && Number(session.endTime) <= Date.now()) {
                clearSession();
            }
            hideMiniClock();
            hideFullscreenGate();
            return;
        }

        refreshSessionClock();
        scheduleFullscreenRestore();
        if (!ticker) {
            ticker = setInterval(refreshSessionClock, 1000);
        }
    }

    return { init, stopSession, markInternalNavigation };
})();

// ─── Init on DOM ready ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (window.DataAgent && typeof window.DataAgent.ready === 'function') {
        window.DataAgent.ready().catch(() => {
            // App keeps working with storage fallback even if Data Agent init fails.
        });
    }

    ThemeManager.init();
    Toast.init();
    setActiveNav();
    FocusSessionBridge.init();

    // Initialize i18n (translations)
    if (typeof I18n !== 'undefined') {
        I18n.init();
    }

    // Theme toggle button
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', () => ThemeManager.toggle());

    // Floating AI button
    const fab = document.getElementById('fabAI');
    if (fab) fab.addEventListener('click', () => {
        window.location.href = 'chat.html';
    });

    // Animate progress bars on page load
    document.querySelectorAll('.progress-fill[data-target]').forEach(el => {
        animateProgress(el, parseFloat(el.dataset.target));
    });

    // Sync sidebar exam selector across all pages
    const examSel = document.querySelector('.sidebar-exam select');
    if (examSel) {
        examSel.value = ExamManager.get();
        examSel.addEventListener('change', () => {
            ExamManager.set(examSel.value);
            // Re-render topic pills if on quiz page
            if (typeof renderTopicPills === 'function') renderTopicPills();
        });
    }
});


// --- Bottom Navigation Injection and Auto-Hide ---
function injectBottomNav() {
    // Exclude auth pages if needed
    const path = window.location.pathname.split('/').pop() || '';
    if(path.includes('login') || path.includes('signup')) return;
    
    // Remove any existing hardcoded bottom navs to avoid duplicates
    document.querySelectorAll('.bottom-nav').forEach(el => el.remove());
    
    const navItems = [
        { page: 'dashboard.html', title: 'Dashboard', icon: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect>' },
        { page: 'learning.html', title: 'Learning Journey', icon: '<circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path><circle cx="18" cy="5" r="3"></circle>' },
        { page: 'chat.html', title: 'AI Tutor', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>' },
        { page: 'community.html', title: 'Community', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
        { page: 'leaderboard.html', title: 'Leaderboard', icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>' },
        { page: 'quiz.html', title: 'Daily Quiz', icon: '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>' },
        { page: 'revision.html', title: 'Revision Notes', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>' },
          { page: 'exam.html', title: 'Exam Mode', icon: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path>' },
        { page: 'videos.html', title: 'Videos', icon: '<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2"></rect>' },
        { page: 'profile.html', title: 'Profile', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>' }
    ];

    const nav = document.createElement('nav');
    nav.id = 'floatingBottomNav';
    
    let currentPathForNav = window.location.pathname.split('/').pop() || 'dashboard.html';
    if (currentPathForNav === '' || currentPathForNav === '/') currentPathForNav = 'dashboard.html';

    nav.className = currentPathForNav === 'chat.html' ? 'bottom-nav chat-nav-vertical' : 'bottom-nav';


    const inner = document.createElement('div');
    inner.className = 'bottom-nav-inner';
    
    // Determine active page
    
    let currentPath = currentPathForNav;


    navItems.forEach(item => {
        const a = document.createElement('a');
        a.href = item.page;
        a.setAttribute('data-title', item.title);
        a.className = 'b-nav-item';
        if(currentPath === item.page) a.classList.add('active');
        a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + item.icon + '</svg>';
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
        navTimeout = setTimeout(hideNav, 2500); // Hide after 2.5s of inactivity
    };

    // Initial show
    showNav();

    // Prevent hiding when hovering over the nav itself
    nav.addEventListener('mouseenter', () => clearTimeout(navTimeout));
    nav.addEventListener('mouseleave', showNav);

    // Event Listeners for Interaction Detection
    window.addEventListener('mousemove', showNav);
    window.addEventListener('scroll', showNav, {passive: true});
    window.addEventListener('keydown', showNav);
    window.addEventListener('touchstart', showNav, {passive: true});
    window.addEventListener('click', showNav);
}

// Append the bottom nav when the DOM is ready
document.addEventListener('DOMContentLoaded', injectBottomNav);

// ─── Learning Path Engine (per-question state tracking) ──────
const LearningPathEngine = {
    getState() {
        return readSharedData('userState', null);
    },
    getPlan() {
        return readSharedData('learningPlan', null);
    },
    updateFromQuiz(topic, isCorrect, timeTaken) {
        const state = this.getState();
        if (!state) return;
        // Track per-topic accuracy in userState
        if (!state._quizLog) state._quizLog = {};
        if (!state._quizLog[topic]) state._quizLog[topic] = { correct: 0, total: 0 };
        state._quizLog[topic].total++;
        if (isCorrect) state._quizLog[topic].correct++;
        writeSharedData('userState', state);
    },
    logPerformance(topic, score) {
        const state = this.getState();
        if (!state) return;
        if (score >= 70) {
            if (!state.strongTopics.includes(topic)) state.strongTopics.push(topic);
            state.weakTopics = state.weakTopics.filter(t => t !== topic);
        } else {
            if (!state.weakTopics.includes(topic)) state.weakTopics.push(topic);
        }
        writeSharedData('userState', state);
    }
};
