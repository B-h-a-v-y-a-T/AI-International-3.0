/* ═══════════════════════════════════════════════════════════════════════════════
   AI Tutor — Frontend Logic
   Manages chat, interactive blocks, dashboard, and study plans.
═══════════════════════════════════════════════════════════════════════════════ */

// ── State ────────────────────────────────────────────────────────────────────
const TutorState = {
  currentMode: 'ask',
  userId: '',
  token: '',
  conversationHistory: [],
  isLoading: false,
  dashboardData: null,
  studyPlan: null,
};

// ── Auth ─────────────────────────────────────────────────────────────────────
function getTutorAuth() {
  try {
    const token = localStorage.getItem('token') || '';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    TutorState.token = token;
    TutorState.userId = user.email || user.id || 'anonymous';
    return { token, user };
  } catch {
    return { token: '', user: {} };
  }
}

function tutorFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(TutorState.token ? { 'Authorization': `Bearer ${TutorState.token}` } : {}),
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TUTOR CHAT
// ═══════════════════════════════════════════════════════════════════════════════

const TutorChat = {
  messagesEl: null,
  inputEl: null,
  sendBtn: null,

  init() {
    this.messagesEl = document.getElementById('tutorMessages');
    this.inputEl = document.getElementById('tutorInput');
    this.sendBtn = document.getElementById('tutorSendBtn');

    if (this.inputEl) {
      this.inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.send();
        }
      });
      // Auto-resize textarea
      this.inputEl.addEventListener('input', () => {
        this.inputEl.style.height = 'auto';
        this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 120) + 'px';
      });
    }
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.send());
    }
  },

  async send() {
    const message = this.inputEl?.value?.trim();
    if (!message || TutorState.isLoading) return;

    // Add user message
    this.addMessage('user', message);
    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';

    // Show typing indicator
    TutorState.isLoading = true;
    this.sendBtn.disabled = true;
    this.showTyping();

    // Remove welcome if visible
    const welcome = document.getElementById('tutorWelcome');
    if (welcome) welcome.style.display = 'none';

    try {
      const res = await tutorFetch('/api/tutor/chat', {
        method: 'POST',
        body: JSON.stringify({
          userId: TutorState.userId,
          message,
          mode: TutorState.currentMode,
          conversationHistory: TutorState.conversationHistory.slice(-8),
        }),
      });

      const data = await res.json();
      this.hideTyping();

      if (data.error) {
        this.addMessage('bot', '⚠️ ' + data.error);
        return;
      }

      // Parse response if it's stringified JSON
      let responseText = data.response;
      let parsedResponse = {};
      try {
        if (typeof responseText === 'string' && responseText.trim().startsWith('{')) {
          parsedResponse = JSON.parse(responseText);
          responseText = parsedResponse.reply || responseText;
        }
      } catch {
        // If parsing fails, use the response as-is
      }

      // Add bot response
      this.addMessage('bot', responseText, {
        citations: data.citations,
        followUpQuestions: data.followUpQuestions,
        interactiveBlocks: data.interactiveBlocks,
        emotion: data.emotion,
        source: data.source,
      });

      // Update conversation history
      TutorState.conversationHistory.push(
        { role: 'user', text: message },
        { role: 'bot', text: data.response }
      );

      // Refresh dashboard
      DashboardManager.load();
    } catch (err) {
      this.hideTyping();
      this.addMessage('bot', '❌ Network error. Please check your connection.');
    } finally {
      TutorState.isLoading = false;
      this.sendBtn.disabled = false;
    }
  },

  addMessage(role, text, extras = {}) {
    if (!this.messagesEl) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `tutor-msg ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'tutor-msg-bubble';
    bubble.innerHTML = this.formatText(text);
    msgDiv.appendChild(bubble);

    // Citations
    if (extras.citations?.length > 0) {
      const citDiv = document.createElement('div');
      citDiv.className = 'tutor-citations';
      extras.citations.forEach(c => {
        const chip = document.createElement('span');
        chip.className = 'tutor-citation';
        chip.textContent = `📄 ${c.source || 'Source'}`;
        chip.title = c.chunk || '';
        citDiv.appendChild(chip);
      });
      msgDiv.appendChild(citDiv);
    }

    // Interactive blocks
    if (extras.interactiveBlocks?.length > 0) {
      extras.interactiveBlocks.forEach(block => {
        const rendered = InteractiveBlockRenderer.render(block);
        if (rendered) msgDiv.appendChild(rendered);
      });
    }

    // Follow-up questions
    if (extras.followUpQuestions?.length > 0) {
      const fDiv = document.createElement('div');
      fDiv.className = 'tutor-followups';
      extras.followUpQuestions.forEach(q => {
        const chip = document.createElement('button');
        chip.className = 'tutor-followup-chip';
        chip.textContent = q;
        chip.addEventListener('click', () => {
          this.inputEl.value = q;
          this.send();
        });
        fDiv.appendChild(chip);
      });
      msgDiv.appendChild(fDiv);
    }

    // Meta
    if (role === 'bot' && extras.source) {
      const meta = document.createElement('div');
      meta.className = 'tutor-msg-meta';
      meta.textContent = `${extras.emotion || ''} · ${extras.source}`;
      msgDiv.appendChild(meta);
    }

    this.messagesEl.appendChild(msgDiv);
    this.scrollToBottom();
  },

  showTyping() {
    if (!this.messagesEl) return;
    const existing = this.messagesEl.querySelector('.tutor-typing');
    if (existing) return;
    const el = document.createElement('div');
    el.className = 'tutor-typing';
    el.innerHTML = '<div class="tutor-typing-dot"></div><div class="tutor-typing-dot"></div><div class="tutor-typing-dot"></div>';
    this.messagesEl.appendChild(el);
    this.scrollToBottom();
  },

  hideTyping() {
    if (!this.messagesEl) return;
    const el = this.messagesEl.querySelector('.tutor-typing');
    if (el) el.remove();
  },

  scrollToBottom() {
    if (this.messagesEl) {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
  },

  formatText(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  },

  sendQuickMessage(text) {
    if (this.inputEl) this.inputEl.value = text;
    this.send();
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE BLOCK RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

const InteractiveBlockRenderer = {
  render(block) {
    if (!block || !block.type) return null;
    switch (block.type) {
      case 'quiz': return this.renderQuiz(block.data);
      case 'flashcard': return this.renderFlashcard(block.data);
      case 'concept': return this.renderConcept(block.data);
      case 'example': return this.renderExample(block.data);
      case 'practice': return this.renderPractice(block.data);
      default: return null;
    }
  },

  renderQuiz(data) {
    const block = document.createElement('div');
    block.className = 'tutor-block quiz';
    block.innerHTML = `
      <div class="tutor-block-header">🧠 Quiz Question</div>
      <div class="tutor-block-body">
        <div style="font-weight:600;margin-bottom:10px;">${this.escapeHtml(data.question || '')}</div>
        <div class="quiz-options"></div>
        ${data.hint ? `<div class="quiz-hint" style="display:none;">💡 <strong>Hint:</strong> ${this.escapeHtml(data.hint)}</div>` : ''}
        ${data.explanation ? `<div class="quiz-explanation" style="display:none;">✅ ${this.escapeHtml(data.explanation)}</div>` : ''}
        <div style="margin-top:10px;display:flex;gap:8px;">
          ${data.hint ? '<button class="tutor-followup-chip quiz-hint-btn">Show Hint</button>' : ''}
        </div>
      </div>
    `;

    const optionsContainer = block.querySelector('.quiz-options');
    (data.options || []).forEach((opt, i) => {
      const optEl = document.createElement('div');
      optEl.className = 'quiz-option';
      optEl.textContent = opt;
      optEl.addEventListener('click', () => {
        block.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected', 'correct', 'incorrect'));
        if (i === data.answer) {
          optEl.classList.add('correct');
          const expl = block.querySelector('.quiz-explanation');
          if (expl) expl.style.display = 'block';
        } else {
          optEl.classList.add('incorrect');
          const correctOpt = optionsContainer.children[data.answer];
          if (correctOpt) correctOpt.classList.add('correct');
          const expl = block.querySelector('.quiz-explanation');
          if (expl) expl.style.display = 'block';
        }
      });
      optionsContainer.appendChild(optEl);
    });

    const hintBtn = block.querySelector('.quiz-hint-btn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        const hint = block.querySelector('.quiz-hint');
        if (hint) hint.style.display = 'block';
        hintBtn.style.display = 'none';
      });
    }

    return block;
  },

  renderFlashcard(data) {
    const block = document.createElement('div');
    block.className = 'tutor-block flashcard';
    block.innerHTML = `
      <div class="tutor-block-header">📇 Flashcard</div>
      <div class="tutor-block-body">
        <div class="flashcard-inner" onclick="this.classList.toggle('flipped')">
          <div class="flashcard-face front">${this.escapeHtml(data.front || '')}</div>
          <div class="flashcard-face back">${this.escapeHtml(data.back || '')}</div>
        </div>
        <div class="flashcard-flip-hint">Click to flip</div>
      </div>
    `;
    return block;
  },

  renderConcept(data) {
    const block = document.createElement('div');
    block.className = 'tutor-block concept';
    const points = (data.points || []).map(p => `<li>${this.escapeHtml(p)}</li>`).join('');
    block.innerHTML = `
      <div class="tutor-block-header">📘 ${this.escapeHtml(data.title || 'Key Concepts')}</div>
      <div class="tutor-block-body">
        <ul class="concept-points">${points}</ul>
      </div>
    `;
    return block;
  },

  renderExample(data) {
    const block = document.createElement('div');
    block.className = 'tutor-block example';
    block.innerHTML = `
      <div class="tutor-block-header">💡 ${this.escapeHtml(data.title || 'Example')}</div>
      <div class="tutor-block-body">
        <div>${this.escapeHtml(data.content || '')}</div>
        ${data.explanation ? `<div style="margin-top:10px;padding:10px;background:rgba(252,211,77,0.08);border-radius:var(--radius-sm);font-size:13px;">${this.escapeHtml(data.explanation)}</div>` : ''}
      </div>
    `;
    return block;
  },

  renderPractice(data) {
    const block = document.createElement('div');
    block.className = 'tutor-block practice';
    const steps = (data.steps || []).map(s => `<div class="practice-step">${this.escapeHtml(s)}</div>`).join('');
    block.innerHTML = `
      <div class="tutor-block-header">🏋️ Practice Problem</div>
      <div class="tutor-block-body">
        <div style="font-weight:600;margin-bottom:10px;">${this.escapeHtml(data.problem || '')}</div>
        <div class="practice-steps">${steps}</div>
        ${data.answer ? `<div style="margin-top:12px;"><button class="tutor-followup-chip" onclick="this.nextElementSibling.style.display='block';this.style.display='none';">Show Answer</button><div style="display:none;" class="quiz-explanation">📝 ${this.escapeHtml(data.answer)}</div></div>` : ''}
      </div>
    `;
    return block;
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const DashboardManager = {
  async load() {
    try {
      const res = await tutorFetch(`/api/tutor/dashboard/${encodeURIComponent(TutorState.userId)}`);
      const data = await res.json();
      TutorState.dashboardData = data;
      this.render(data);
    } catch (err) {
      console.error('[Dashboard] Load error:', err);
    }
  },

  render(data) {
    this.renderStats(data);
    this.renderMasteryHeatmap(data.masteryHeatmap || []);
    this.renderWeakTopics(data.weakTopics || []);
    this.renderStrongTopics(data.strongTopics || []);
    this.renderStreak(data.studyStreak || 0);
    this.renderRisk(data.riskAnalysis || { level: 'low', score: 0, factors: [] });
    this.renderProgressChart(data.dailyProgress || []);
    this.renderConfidenceChart(data.confidenceTrend || []);
  },

  renderStats(data) {
    const el = document.getElementById('tutorStatsRow');
    if (!el) return;
    const metrics = data.metrics || {};
    const profile = data.profile || {};
    el.innerHTML = `
      <div class="tutor-stat-box">
        <span class="tutor-stat-value">${((profile.mastery_score || 0) * 100).toFixed(0)}%</span>
        <span class="tutor-stat-label">Mastery</span>
      </div>
      <div class="tutor-stat-box">
        <span class="tutor-stat-value">${((profile.confidence_score || 0.5) * 100).toFixed(0)}%</span>
        <span class="tutor-stat-label">Confidence</span>
      </div>
      <div class="tutor-stat-box">
        <span class="tutor-stat-value">${metrics.totalAttempts || 0}</span>
        <span class="tutor-stat-label">Attempts</span>
      </div>
    `;
  },

  renderMasteryHeatmap(heatmap) {
    const el = document.getElementById('masteryHeatmap');
    if (!el) return;
    if (!heatmap.length) {
      el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px;">No topics studied yet</div>';
      return;
    }
    el.innerHTML = heatmap.map(item => `
      <div class="mastery-cell ${item.status}">
        <span class="mastery-value">${(item.mastery * 100).toFixed(0)}%</span>
        ${item.topic.length > 12 ? item.topic.slice(0, 12) + '…' : item.topic}
      </div>
    `).join('');
  },

  renderWeakTopics(topics) {
    const el = document.getElementById('weakTopicsList');
    if (!el) return;
    if (!topics.length) {
      el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px 0;">No weak topics — great job! 🎉</div>';
      return;
    }
    el.innerHTML = topics.slice(0, 5).map(t => `
      <div class="topic-list-item">
        <span>${t.topic}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="topic-badge weak">${(t.weakness_score * 100).toFixed(0)}%</span>
          <button class="topic-practice-btn" onclick="TutorChat.sendQuickMessage('Practice ${t.topic}')">Practice</button>
        </div>
      </div>
    `).join('');
  },

  renderStrongTopics(topics) {
    const el = document.getElementById('strongTopicsList');
    if (!el) return;
    if (!topics.length) {
      el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px 0;">Keep studying to build mastery!</div>';
      return;
    }
    el.innerHTML = topics.slice(0, 5).map(t => `
      <div class="topic-list-item">
        <span>${t.topic}</span>
        <span class="topic-badge strong">${(t.mastery_score * 100).toFixed(0)}%</span>
      </div>
    `).join('');
  },

  renderStreak(streak) {
    const el = document.getElementById('streakDisplay');
    if (!el) return;
    el.innerHTML = `
      <div class="streak-display">
        <span class="streak-flame">${streak > 0 ? '🔥' : '❄️'}</span>
        <div>
          <span class="streak-number">${streak}</span>
          <span class="streak-label"> day${streak !== 1 ? 's' : ''} streak</span>
        </div>
      </div>
    `;
  },

  renderRisk(risk) {
    const el = document.getElementById('riskIndicator');
    if (!el) return;
    const icons = { low: '🟢', medium: '🟡', high: '🔴' };
    el.innerHTML = `
      <div class="risk-indicator ${risk.level}">
        <span class="risk-dot ${risk.level}"></span>
        <span>${icons[risk.level] || '🟢'} Risk Level: ${risk.level.toUpperCase()}</span>
      </div>
      ${risk.factors?.length ? `<div style="margin-top:6px;font-size:12px;color:var(--text-muted);">${risk.factors.join(' · ')}</div>` : ''}
    `;
  },

  renderProgressChart(dailyProgress) {
    const canvas = document.getElementById('progressChart');
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext('2d');
    if (canvas._chart) canvas._chart.destroy();

    canvas._chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dailyProgress.map(d => d.label),
        datasets: [{
          label: 'Interactions',
          data: dailyProgress.map(d => d.interactions),
          backgroundColor: 'rgba(167, 139, 250, 0.6)',
          borderColor: '#A78BFA',
          borderWidth: 2,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
          x: { grid: { display: false } },
        },
      },
    });
  },

  renderConfidenceChart(trend) {
    const canvas = document.getElementById('confidenceChart');
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext('2d');
    if (canvas._chart) canvas._chart.destroy();

    canvas._chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trend.map(t => `#${t.index}`),
        datasets: [{
          label: 'Score',
          data: trend.map(t => (t.score * 100).toFixed(0)),
          borderColor: '#6EE7B7',
          backgroundColor: 'rgba(110, 231, 183, 0.1)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#6EE7B7',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
          x: { grid: { display: false } },
        },
      },
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STUDY PLAN MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const StudyPlanManager = {
  async load(duration = 7) {
    const container = document.getElementById('studyPlanContent');
    if (!container) return;
    container.innerHTML = '<div class="shimmer" style="height:200px;"></div>';

    try {
      const res = await tutorFetch(`/api/tutor/study-plan/${encodeURIComponent(TutorState.userId)}?duration=${duration}`);
      const plan = await res.json();
      TutorState.studyPlan = plan;
      this.render(plan, container);
    } catch (err) {
      container.innerHTML = '<div style="color:var(--text-muted);padding:16px;text-align:center;">Could not load study plan</div>';
    }
  },

  render(plan, container) {
    if (!container || !plan) return;

    const daysHtml = (plan.dailyPlan || []).slice(0, 7).map(day => `
      <div class="plan-day">
        <div class="plan-day-header">${day.date}${day.quizScheduled ? ' 📝 Quiz Day' : ''}</div>
        ${(day.tasks || []).map(t => `
          <div class="plan-task">
            <span class="plan-task-time">${t.time || ''}</span>
            <span>${t.topic || t.subject || ''}</span>
            <span class="plan-task-badge ${t.priority || 'medium'}">${(t.priority || 'medium').toUpperCase()}</span>
          </div>
        `).join('')}
      </div>
    `).join('');

    container.innerHTML = `
      <div style="font-weight:700;font-size:14px;margin-bottom:12px;">${plan.planName || 'Study Plan'}</div>
      ${daysHtml}
      ${plan.tips?.length ? `
        <div style="margin-top:14px;padding:12px;border-radius:var(--radius-sm);background:rgba(252,211,77,0.1);border-left:3px solid var(--accent-yellow);">
          <div style="font-weight:700;font-size:13px;margin-bottom:6px;">💡 Tips</div>
          ${plan.tips.map(t => `<div style="font-size:12.5px;margin:4px 0;">• ${t}</div>`).join('')}
        </div>
      ` : ''}
    `;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODE SWITCHING
// ═══════════════════════════════════════════════════════════════════════════════

function setTutorMode(mode) {
  TutorState.currentMode = mode;
  document.querySelectorAll('.tutor-mode-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });

  // Update header subtitle
  const subtitleEl = document.querySelector('.tutor-chat-header .subtitle');
  if (subtitleEl) {
    const subtitles = {
      learn: 'Concept explanations, step-by-step teaching',
      practice: 'Adaptive questions, hints & explanations',
      revise: 'Flashcards, quick notes, summaries',
      exam: 'Timed tests, mock exams, predictions',
      ask: 'Open chat with your AI tutor',
    };
    subtitleEl.textContent = subtitles[mode] || subtitles.ask;
  }
  
  // Update placeholder and focus input to show the button "worked"
  const input = document.getElementById('tutorInput');
  if(input) {
      const placeholders = {
          learn: 'What concept should we explore?',
          practice: 'Ready for some questions? Type a topic...',
          revise: 'What topic do you want to review?',
          exam: 'Type a subject to start a mock test...',
          ask: 'Ask your tutor anything...'
      };
      input.placeholder = placeholders[mode] || placeholders.ask;
      input.focus();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  getTutorAuth();

  // Redirect if not logged in
  if (!TutorState.token) {
    window.location.href = '/login.html';
    return;
  }

  // Init theme
  if (typeof ThemeManager !== 'undefined') ThemeManager.init();
  if (typeof setActiveNav === 'function') setActiveNav();

  // Init chat
  TutorChat.init();

  // Init mode tabs
  document.querySelectorAll('.tutor-mode-tab').forEach(tab => {
    tab.addEventListener('click', () => setTutorMode(tab.dataset.mode));
  });

  // Set default mode
  setTutorMode('ask');

  // Load dashboard
  DashboardManager.load();

  // Study plan tabs
  document.querySelectorAll('.study-plan-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.study-plan-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      StudyPlanManager.load(parseInt(tab.dataset.duration));
    });
  });

  // Mobile dashboard toggle
  const mobileToggle = document.getElementById('dashboardMobileToggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const panel = document.querySelector('.tutor-dashboard-panel');
      if (panel) panel.classList.toggle('mobile-open');
    });
  }

  // Quick actions
  document.querySelectorAll('.tutor-quick-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.dataset.message;
      if (msg) TutorChat.sendQuickMessage(msg);
    });
  });

  // Init lucide icons
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // File upload
  const uploadBtn = document.getElementById('tutorUploadBtn');
  const fileInput = document.getElementById('tutorFileInput');
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
  }
});

async function handleFileUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_name', file.name);

  TutorChat.addMessage('user', `📎 Uploading ${file.name}...`);

  try {
    const res = await fetch('/api/tutor/upload', {
      method: 'POST',
      body: formData,
    });

    // Forward to RAG ingest via Python backend
    const ragRes = await fetch('http://localhost:8050/api/rag/ingest', {
      method: 'POST',
      body: formData,
    });

    const data = await ragRes.json();
    if (data.success) {
      TutorChat.addMessage('bot', `✅ "${file.name}" has been indexed! (${data.chunks_added} chunks). You can now ask questions about its content.`);
    } else {
      TutorChat.addMessage('bot', `⚠️ Could not process "${file.name}". Try a different file format.`);
    }
  } catch (err) {
    TutorChat.addMessage('bot', `❌ Upload failed. Make sure the RAG service is running.`);
  }

  e.target.value = '';
}


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
