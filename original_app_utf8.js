/* =====================================================
   AdaptEd Ai ΓÇô Shared App Logic
===================================================== */

// ΓöÇΓöÇΓöÇ Theme Management ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const ThemeManager = {
    init() {
        const saved = localStorage.getItem('ls-theme') || 'light';
        this.apply(saved);
    },
    apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('ls-theme', theme);
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

// ΓöÇΓöÇΓöÇ Sidebar Active Link ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        el.classList.toggle('active', el.dataset.page === path);
    });
}

// ΓöÇΓöÇΓöÇ Toast Notifications ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
        const icons = { success: '≡ƒÄë', warning: 'ΓÜá∩╕Å', info: '≡ƒÆí' };
        t.innerHTML = `
      <div style="display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:18px">${icons[type] || '≡ƒÆ¼'}</span>
        <span style="font-size:13px;line-height:1.5">${msg}</span>
      </div>`;
        this.container.appendChild(t);
        setTimeout(() => {
            t.style.animation = 'toastSlideOut 0.3s forwards';
            setTimeout(() => t.remove(), 300);
        }, duration);
    }
};

// ΓöÇΓöÇΓöÇ Emotion Pills ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const EmotionColors = {
    Confident: { bg: 'rgba(110,231,183,0.15)', color: '#10B981', emoji: '≡ƒÿè' },
    Confused: { bg: 'rgba(252,211,77,0.15)', color: '#D97706', emoji: '≡ƒñö' },
    Frustrated: { bg: 'rgba(252,165,165,0.15)', color: '#EF4444', emoji: '≡ƒÿñ' },
    Anxious: { bg: 'rgba(167,139,250,0.15)', color: '#7C3AED', emoji: '≡ƒÿ░' },
    Neutral: { bg: 'rgba(148,163,184,0.15)', color: '#64748B', emoji: '≡ƒÿÉ' },
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

// ΓöÇΓöÇΓöÇ Progress Animation ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

// ΓöÇΓöÇΓöÇ Countdown Timer ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

// ΓöÇΓöÇΓöÇ Fake Typing Effect ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

// ΓöÇΓöÇΓöÇ Study Activity Tracker (localStorage-backed) ΓöÇΓöÇΓöÇΓöÇ
const StudyTracker = {
    STORAGE_KEY: 'ls-study-activity',

    /** Get all activity data as { "YYYY-MM-DD": questionsSolved, ... } */
    getAll() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {};
        } catch { return {}; }
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
     * @param {number} count ΓÇô number of questions solved in this session
     */
    logSubmission(count) {
        const data = this.getAll();
        const key = this._dateKey();
        data[key] = (data[key] || 0) + count;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    },

    /** Return the solve count for a specific Date object */
    getCount(date) {
        return this.getAll()[this._dateKey(date)] || 0;
    },

    /**
     * Map a daily solve-count to an intensity level 0-3.
     *   0 ΓåÆ no activity
     *   1 ΓåÆ 1-3  questions  (less)
     *   2 ΓåÆ 4-8  questions  (medium)
     *   3 ΓåÆ 9+   questions  (more)
     */
    level(count) {
        if (count <= 0) return 0;
        if (count <= 3) return 1;
        if (count <= 8) return 2;
        return 3;
    }
};

// ΓöÇΓöÇΓöÇ Exam Manager ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const ExamManager = {
    STORAGE_KEY: 'ls-exam',
    get() { return localStorage.getItem(this.STORAGE_KEY) || 'JEE'; },
    set(exam) { localStorage.setItem(this.STORAGE_KEY, exam); }
};

// ΓöÇΓöÇΓöÇ Adaptive Quiz Engine ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function _shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

const QuizEngine = {
    STORAGE_KEY: 'ls-quiz-perf',

    getPerf() {
        try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {}; }
        catch { return {}; }
    },
    savePerf(p) { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(p)); },

    getTopicPerf(topic) {
        return this.getPerf()[topic] || { ema: 0.5, attempts: 0, wrongIds: [] };
    },

    /**
     * Update EMA accuracy for a topic after a quiz session.
     * Uses exponential moving average (╬▒ = 0.35) so recent performance matters more.
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
     *   < 5 attempts  ΓåÆ medium (warm-up phase)
     *   ema ΓëÑ 0.78    ΓåÆ hard
     *   ema Γëñ 0.42    ΓåÆ easy
     *   otherwise     ΓåÆ medium
     */
    getDifficulty(topic) {
        const { ema, attempts } = this.getTopicPerf(topic);
        if (attempts < 5) return 'medium';
        if (ema >= 0.78) return 'hard';
        if (ema <= 0.42) return 'easy';
        return 'medium';
    },

    /**
     * Select `count` questions from a bank for a given topic.
     * Priority order: previously-wrong ΓåÆ current-difficulty ΓåÆ other-difficulty
     */
    selectQuestions(bank, topic, count, mixedTopics) {
        const topics = topic === 'Mixed'
            ? (mixedTopics || ['Physics', 'Chemistry', 'Maths', 'Biology'])
            : [topic];

        let pool = [];
        topics.forEach(t => {
            const diff = this.getDifficulty(t);
            const { wrongIds } = this.getTopicPerf(t);
            const tqs = bank.filter(q => q.topic === t);
            const wSet = new Set(wrongIds || []);
            const wrong = _shuffle(tqs.filter(q => wSet.has(q.id)));
            const diffMatch = _shuffle(tqs.filter(q => !wSet.has(q.id) && q.difficulty === diff));
            const rest = _shuffle(tqs.filter(q => !wSet.has(q.id) && q.difficulty !== diff));
            pool.push(...wrong, ...diffMatch, ...rest);
        });

        return _shuffle(pool).slice(0, count);
    }
};

// ΓöÇΓöÇΓöÇ Exam Engine ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const ExamEngine = {
    EXAMS: {
        'JEE': { fullName: 'JEE Main', icon: 'ΓÜí', durationMin: 180, sections: [{ subject: 'Physics', count: 8, marks: 4, negative: -1 }, { subject: 'Chemistry', count: 8, marks: 4, negative: -1 }, { subject: 'Maths', count: 9, marks: 4, negative: -1 }] },
        'NEET': { fullName: 'NEET UG', icon: '≡ƒº¼', durationMin: 200, sections: [{ subject: 'Physics', count: 6, marks: 4, negative: -1 }, { subject: 'Chemistry', count: 6, marks: 4, negative: -1 }, { subject: 'Biology', count: 13, marks: 4, negative: -1 }] },
        'CAT': { fullName: 'CAT', icon: '≡ƒôè', durationMin: 120, sections: [{ subject: 'VARC', count: 7, marks: 3, negative: -1 }, { subject: 'DILR', count: 7, marks: 3, negative: -1 }, { subject: 'QA', count: 6, marks: 3, negative: -1 }] },
        'UPSC': { fullName: 'UPSC Prelims', icon: '≡ƒÅ¢∩╕Å', durationMin: 120, sections: [{ subject: 'History & Polity', count: 7, marks: 2, negative: -0.67 }, { subject: 'Geography', count: 7, marks: 2, negative: -0.67 }, { subject: 'Economy & Environment', count: 6, marks: 2, negative: -0.67 }] },
        'MHT CET': { fullName: 'MHT CET', icon: '≡ƒÄ»', durationMin: 180, sections: [{ subject: 'Physics', count: 8, marks: 2, negative: 0 }, { subject: 'Chemistry', count: 8, marks: 2, negative: 0 }, { subject: 'Maths', count: 9, marks: 2, negative: 0 }] },
        'GATE': { fullName: 'GATE CSE', icon: '≡ƒö¼', durationMin: 180, sections: [{ subject: 'Engineering Maths', count: 7, marks: 2, negative: -0.67 }, { subject: 'General Aptitude', count: 6, marks: 1, negative: -0.33 }, { subject: 'CSE Core', count: 7, marks: 2, negative: -0.67 }] },
    },
    SESSION_KEY: 'ls-exam-session',
    HISTORY_KEY: 'ls-exam-history',

    getConfig(exam) { return this.EXAMS[exam] || this.EXAMS['JEE']; },
    totalQ(exam) { return (this.getConfig(exam).sections || []).reduce((s, x) => s + x.count, 0); },

    saveSession(s) { try { sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(s)); } catch { } },
    getSession() { try { return JSON.parse(sessionStorage.getItem(this.SESSION_KEY)) || null; } catch { return null; } },
    clearSession() { sessionStorage.removeItem(this.SESSION_KEY); },

    saveHistory(r) {
        let h; try { h = JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || []; } catch { h = []; }
        h.push({ ...r, ts: Date.now() });
        if (h.length > 30) h = h.slice(-30);
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(h));
    },
    getHistory() { try { return JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || []; } catch { return []; } },

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

// ΓöÇΓöÇΓöÇ Random Encouragement ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const encouragements = [
    "You're on fire! ≡ƒöÑ Keep going!",
    "Great job! Every question counts ≡ƒÆ¬",
    "That's the spirit! ≡ƒÜÇ",
    "Consistency is the key! ≡ƒù¥∩╕Å",
    "You're building a habit! Keep going ≡ƒÆ¬",
    "Amazing streak! Don't break it ≡ƒÅå",
];
function getEncouragement() {
    return encouragements[Math.floor(Math.random() * encouragements.length)];
}

// ΓöÇΓöÇΓöÇ Init on DOM ready ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    Toast.init();
    setActiveNav();

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

// ΓöÇΓöÇΓöÇ Learning Path Engine (per-question state tracking) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const LearningPathEngine = {
    getState() {
        try { return JSON.parse(localStorage.getItem('userState')) || null; } catch { return null; }
    },
    getPlan() {
        try { return JSON.parse(localStorage.getItem('learningPlan')) || null; } catch { return null; }
    },
    updateFromQuiz(topic, isCorrect, timeTaken) {
        const state = this.getState();
        if (!state) return;
        // Track per-topic accuracy in userState
        if (!state._quizLog) state._quizLog = {};
        if (!state._quizLog[topic]) state._quizLog[topic] = { correct: 0, total: 0 };
        state._quizLog[topic].total++;
        if (isCorrect) state._quizLog[topic].correct++;
        localStorage.setItem('userState', JSON.stringify(state));
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
        localStorage.setItem('userState', JSON.stringify(state));
    }
};
