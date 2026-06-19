// ============================================================================
// AGENTIC AI TUTOR - Frontend Client
// Shared across all pages. Handles user state, decision calls, and safe UI injection.
// ============================================================================

window.AgentTutor = (function () {
  'use strict';

  const QUIZ_HISTORY_KEY = 'agent-quiz-history';
  const SCORE_HISTORY_KEY = 'ls-quiz-scores';
  const SYNC_TS_KEY = 'agent-last-synced-score-ts';

  const CACHE_TTL = 5000;
  let cachedDecision = null;
  let cachedContext = null;
  let cacheTime = 0;
  let syncInFlight = null;

  const MASCOT_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;filter:drop-shadow(0 4px 8px rgba(255,122,31,0.3));">
    <ellipse cx="50" cy="18" rx="14" ry="11" fill="#FF7A1F"/>
    <circle cx="21" cy="72" r="8" fill="#FF7A1F"/>
    <circle cx="79" cy="72" r="8" fill="#FF7A1F"/>
    <ellipse cx="50" cy="54" rx="36" ry="32" fill="#FF7A1F"/>
    <rect x="16" y="42" width="16" height="24" rx="8" fill="#FF7A1F" stroke="#1E1B4B" stroke-width="2.5"/>
    <rect x="68" y="42" width="16" height="24" rx="8" fill="#FF7A1F" stroke="#1E1B4B" stroke-width="2.5"/>
    <rect x="24" y="36" width="52" height="42" rx="16" fill="#1E1B4B"/>
    <path d="M 52 38 L 49 44 L 53 44 L 50 49" stroke="#FFD700" stroke-width="2" fill="none" stroke-linejoin="miter" stroke-linecap="square"/>
    <circle cx="41" cy="56" r="5.5" fill="#FFFFFF"/>
    <circle cx="59" cy="56" r="5.5" fill="#FFFFFF"/>
  </svg>`;

  function safeParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }

  function clamp01(value, fallback = 0.5) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    if (num < 0) return 0;
    if (num > 1) return 1;
    return num;
  }

  function normalizeTopic(topic) {
    return String(topic || '')
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function toDisplayTopic(topic) {
    const clean = normalizeTopic(topic);
    if (!clean) return 'General Concepts';
    return clean.split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function inferSubject(topic) {
    const t = normalizeTopic(topic);
    if (!t) return 'general';
    if (/physics|motion|thermo|electro|mechanic/.test(t)) return 'physics';
    if (/chem|organic|bond/.test(t)) return 'chemistry';
    if (/math|calculus|probability|algebra|geometry/.test(t)) return 'math';
    if (/bio|cell|genetic|physiology/.test(t)) return 'biology';
    return t;
  }

  function readCompat(key, fallback = null) {
    try {
      if (window.DataAgent && typeof window.DataAgent.readCompat === 'function') {
        return window.DataAgent.readCompat(key, fallback);
      }
    } catch {
      // fallback below
    }

    if (typeof fallback === 'string') {
      const value = localStorage.getItem(key);
      return value == null ? fallback : value;
    }

    return safeParse(localStorage.getItem(key), fallback);
  }

  function writeCompat(key, value) {
    try {
      if (window.DataAgent && typeof window.DataAgent.writeCompat === 'function') {
        window.DataAgent.writeCompat(key, value);
        return;
      }
    } catch {
      // fallback below
    }

    if (typeof value === 'string') {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  function getScoreHistory() {
    return readCompat(SCORE_HISTORY_KEY, []);
  }

  function buildTopicStats(history) {
    const stats = {};
    for (const row of history) {
      const topic = normalizeTopic(row.topic || row.subject || 'general concepts');
      if (!topic) continue;
      if (!stats[topic]) stats[topic] = { total: 0, sumPct: 0 };
      stats[topic].total += 1;
      stats[topic].sumPct += Number(row.pct) || 50;
    }
    return stats;
  }

  function deriveWeakStrongFromHistory(history) {
    const stats = buildTopicStats(history);
    const weak = [];
    const strong = [];

    for (const [topic, s] of Object.entries(stats)) {
      const avg = s.total > 0 ? s.sumPct / s.total : 50;
      if (avg < 50) weak.push(toDisplayTopic(topic));
      if (avg >= 80) strong.push(toDisplayTopic(topic));
    }

    return {
      weak: [...new Set(weak)],
      strong: [...new Set(strong)],
    };
  }

  function buildBanditFromHistory(history) {
    const bandit = {};

    for (const row of history) {
      const topic = normalizeTopic(row.topic || row.subject || 'general concepts');
      if (!topic) continue;

      if (!bandit[topic]) bandit[topic] = { shown: 0, reward: 0.5 };
      const node = bandit[topic];
      const reward = clamp01((Number(row.pct) || 50) / 100, 0.5);

      node.shown += 1;
      node.reward = Number(((node.reward * 0.7) + (reward * 0.3)).toFixed(4));
    }

    return bandit;
  }

  function getUserState() {
    const localUserState = readCompat('userState', {});
    const scoreHistory = getScoreHistory();
    const topicSignals = deriveWeakStrongFromHistory(scoreHistory);

    const weakTopics = [...new Set([
      ...(Array.isArray(localUserState.weakTopics) ? localUserState.weakTopics : []),
      ...(Array.isArray(localUserState.weak_topics) ? localUserState.weak_topics : []),
      ...topicSignals.weak,
    ])].map(toDisplayTopic);

    const strongTopics = [...new Set([
      ...(Array.isArray(localUserState.strongTopics) ? localUserState.strongTopics : []),
      ...(Array.isArray(localUserState.strong_topics) ? localUserState.strong_topics : []),
      ...topicSignals.strong,
    ])].map(toDisplayTopic);

    const recentScores = scoreHistory
      .slice(-10)
      .map((row) => clamp01((Number(row.pct) || 50) / 100, 0.5));

    const scoreBuckets = {};
    for (const row of scoreHistory) {
      const subject = inferSubject(row.topic || row.subject || 'general');
      if (!scoreBuckets[subject]) scoreBuckets[subject] = [];
      scoreBuckets[subject].push(Number(row.pct) || 50);
    }

    const scores = {};
    for (const [subject, arr] of Object.entries(scoreBuckets)) {
      if (!arr.length) continue;
      scores[subject] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    }

    return {
      scores,
      weak_topics: weakTopics,
      strong_topics: strongTopics,
      streak: Number(readCompat('agent-streak', '14') || '14') || 14,
      recent_scores: recentScores.length ? recentScores : [0.6, 0.7, 0.5],
      exam: readCompat('ls-exam', 'JEE') || 'JEE',
      last_action: readCompat('agent-last-action', '') || null,
      bandit: buildBanditFromHistory(scoreHistory),
    };
  }

  function getQuizHistory() {
    return readCompat(QUIZ_HISTORY_KEY, []);
  }

  async function postJsonWithFallback(paths, payload, token) {
    let lastError = null;

    for (const route of paths) {
      try {
        const res = await fetch(route, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: 'Bearer ' + token } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status} at ${route}`);
          continue;
        }

        return await res.json();
      } catch (err) {
        lastError = err;
      }
    }

    throw (lastError || new Error('All agent routes failed'));
  }

  function recordQuizResult(subject, topic, score, mistakes = []) {
    const history = getQuizHistory();
    history.push({
      subject,
      topic,
      score,
      mistakes,
      timestamp: new Date().toISOString(),
    });

    if (history.length > 50) history.splice(0, history.length - 50);
    writeCompat(QUIZ_HISTORY_KEY, history);

    const token = readCompat('ls-token', '') || readCompat('token', '');
    postJsonWithFallback(
      ['/agent/user-state', '/api/agent/user-state'],
      { subject, topic, score, mistakes },
      token
    ).catch(() => {});
  }

  async function syncQuizHistoryToBackend() {
    if (syncInFlight) return syncInFlight;

    syncInFlight = (async () => {
      const history = getScoreHistory();
      if (!Array.isArray(history) || history.length === 0) return;

      const token = readCompat('ls-token', '') || readCompat('token', '');
      const lastSyncedTs = Number(readCompat(SYNC_TS_KEY, '0') || '0');
      const unsynced = history
        .filter((row) => Number(row.ts) > lastSyncedTs)
        .sort((a, b) => Number(a.ts || 0) - Number(b.ts || 0));

      if (!unsynced.length) return;

      let newestTs = lastSyncedTs;
      for (const row of unsynced) {
        const ts = Number(row.ts) || 0;
        const topic = toDisplayTopic(row.topic || 'General Concepts');
        const subject = inferSubject(row.topic || 'general');
        const score = clamp01((Number(row.pct) || 50) / 100, 0.5);

        try {
          await postJsonWithFallback(
            ['/agent/user-state', '/api/agent/user-state'],
            { subject, topic, score, mistakes: [] },
            token
          );
          if (ts > newestTs) newestTs = ts;
        } catch {
          // Continue best-effort syncing.
        }
      }

      if (newestTs > lastSyncedTs) {
        writeCompat(SYNC_TS_KEY, String(newestTs));
      }
    })();

    try {
      await syncInFlight;
    } finally {
      syncInFlight = null;
    }
  }

  async function getDecision(context) {
    const now = Date.now();
    if (cachedDecision && cachedContext === context && (now - cacheTime) < CACHE_TTL) {
      return cachedDecision;
    }

    const userState = getUserState();
    const token = readCompat('ls-token', '') || readCompat('token', '');

    try {
      const decision = await postJsonWithFallback(
        ['/agent/decision', '/api/agent/decision'],
        { user_state: userState, context },
        token
      );

      cachedDecision = decision;
      cachedContext = context;
      cacheTime = now;

      if (decision && decision.action) {
        writeCompat('agent-last-action', decision.action);
      }

      return decision;
    } catch (err) {
      console.warn('[AgentTutor] Decision fetch failed, using local fallback:', err.message);
      return localFallback(userState);
    }
  }

  function localFallback(userState) {
    const recent = userState.recent_scores || [0.5];
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const topic = (userState.weak_topics || [])[0] || 'General Concepts';

    if (avg < 0.4) {
      return {
        insight: `Let's revisit ${topic} to rebuild your fundamentals.`,
        action: 'revise',
        reason: `Your recent performance is ${Math.round(avg * 100)}%, below the revision threshold.`,
        recommended_topic: topic,
        difficulty: 'easy',
        source: 'local-fallback',
      };
    }

    if (avg <= 0.8) {
      return {
        insight: `Practice on ${topic} now to improve consistency.`,
        action: 'practice',
        reason: `At ${Math.round(avg * 100)}% accuracy, focused practice is the optimal next step.`,
        recommended_topic: topic,
        difficulty: 'medium',
        source: 'local-fallback',
      };
    }

    return {
      insight: `Great performance. You are ready to advance in ${topic}.`,
      action: 'advance',
      reason: `${Math.round(avg * 100)}% recent accuracy supports moving to harder work.`,
      recommended_topic: topic,
      difficulty: 'hard',
      source: 'local-fallback',
    };
  }

  function renderAgentOSBar(decision) {
    if (!decision) return;

    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    let osBar = document.getElementById('agent-os-bar');
    if (!osBar) {
      osBar = document.createElement('div');
      osBar.id = 'agent-os-bar';

      const actionLabel = decision.action === 'revise'
        ? 'Revise Path'
        : decision.action === 'advance'
          ? 'Advance Path'
          : 'Practice Path';

      const statusBadge = decision.trend === 'declining' || decision.confidence === 'low'
        ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:#FEF2F2;color:#991B1B;border:1px solid #FECACA;">${escapeHtml(actionLabel)}</span>`
        : `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:#EEF2FF;color:#3730A3;border:1px solid #C7D2FE;">${escapeHtml(actionLabel)}</span>`;

      osBar.innerHTML = `
        <div class="os-left">
          <div class="os-mascot">${MASCOT_SVG}</div>
          <div class="os-status">AgentOS</div>
          ${statusBadge}
        </div>
        <div class="os-center" id="os-insight-text">${escapeHtml(decision.insight || '')}</div>
        <div class="os-right">
          <button id="os-action-btn" class="btn btn-sm btn-primary" style="background:#4F46E5;border-color:#312E81;color:white;font-size:12px;cursor:default;">
            Focus: ${escapeHtml(decision.recommended_topic || 'General Concepts')}
          </button>
        </div>
      `;

      mainContent.insertBefore(osBar, mainContent.firstChild);
      setTimeout(() => osBar.classList.add('visible'), 50);
    } else {
      const insightEl = document.getElementById('os-insight-text');
      const actionBtn = document.getElementById('os-action-btn');
      if (insightEl) insightEl.textContent = decision.insight || '';
      if (actionBtn) actionBtn.textContent = `Focus: ${decision.recommended_topic || 'General Concepts'}`;
    }

    osBar.dataset.defaultInsight = decision.insight || '';
    osBar.dataset.defaultFocus = decision.recommended_topic || 'General Concepts';
    osBar.dataset.defaultAction = decision.action || 'practice';

    const btn = document.getElementById('os-action-btn');
    if (btn) {
      btn.style.cursor = 'pointer';
      btn.onclick = (e) => {
        e.preventDefault();
        window.location.href = `quiz.html?topic=${encodeURIComponent(decision.recommended_topic || 'General Concepts')}`;
      };
    }
  }

  function initDynamicTracking() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a') || e.target.closest('.btn');
      if (!target) return;

      if (target.tagName === 'A' && (target.target === '_blank' || target.getAttribute('href')?.startsWith('#'))) return;
      if (target.id === 'os-action-btn') return;

      const osBar = document.getElementById('agent-os-bar');
      if (!osBar) return;

      const textEl = document.getElementById('os-insight-text');
      const btnEl = document.getElementById('os-action-btn');
      const defaultInsight = osBar.dataset.defaultInsight || 'Keep going, you are improving.';
      const defaultFocus = osBar.dataset.defaultFocus || 'General Concepts';
      const defaultAction = osBar.dataset.defaultAction || 'practice';

      const restoreDefault = () => {
        if (textEl) textEl.textContent = defaultInsight;
        if (btnEl) btnEl.textContent = `Focus: ${defaultFocus}`;
      };

      if (target.tagName === 'A') {
        e.preventDefault();
        const href = target.href;
        const navName = String(target.getAttribute('data-title') || target.textContent || '').trim();

        osBar.classList.add('os-thinking');
        if (textEl) {
          textEl.textContent = navName
            ? `Updating ${defaultAction} plan for ${navName}...`
            : `Updating ${defaultAction} plan for ${defaultFocus}...`;
        }
        if (btnEl) btnEl.textContent = `Focus: ${defaultFocus}`;

        setTimeout(() => {
          window.location.href = href;
        }, 600);
      } else {
        osBar.classList.add('os-thinking');
        if (textEl) textEl.textContent = `Refreshing recommendation for ${defaultFocus}...`;

        setTimeout(() => {
          osBar.classList.remove('os-thinking');
          restoreDefault();
        }, 700);
      }
    });
  }

  function upsertCard(id, parent, html, afterEl = null) {
    if (!parent) return null;

    let card = document.getElementById(id);
    if (!card) {
      card = document.createElement('div');
      card.id = id;
      card.className = 'dash-card';
      card.style.marginTop = '16px';

      if (afterEl && afterEl.parentNode) {
        afterEl.parentNode.insertBefore(card, afterEl.nextSibling);
      } else {
        parent.prepend(card);
      }
    }

    card.innerHTML = html;
    return card;
  }

  function injectDashboardInsight(decision) {
    const main = document.querySelector('.main-content');
    const hero = document.querySelector('.hero-section');
    if (!main || !hero) return;

    upsertCard(
      'agent-insight-dashboard',
      main,
      `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
         <div style="font-size:13px;font-weight:800;color:#4F46E5;letter-spacing:0.06em;text-transform:uppercase;">AI Insight</div>
         <span style="font-size:11px;font-weight:700;background:#EEF2FF;color:#3730A3;padding:4px 10px;border-radius:999px;">${escapeHtml((decision.action || 'practice').toUpperCase())}</span>
       </div>
       <p style="margin:10px 0 6px 0;font-size:16px;font-weight:700;color:#1F2937;">${escapeHtml(decision.insight || '')}</p>
       <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.5;">${escapeHtml(decision.reason || '')}</p>
       <p style="margin:10px 0 0 0;font-size:12px;color:#374151;"><strong>Recommended Topic:</strong> ${escapeHtml(decision.recommended_topic || 'General Concepts')}</p>`,
      hero
    );
  }

  function injectLearningAdjustment(decision) {
    const taskContainer = document.getElementById('todays-task-container');
    if (!taskContainer || !taskContainer.parentElement) return;

    const mode = decision.action === 'revise'
      ? 'Revisiting'
      : decision.action === 'advance'
        ? 'Advancing into'
        : 'Practicing';

    upsertCard(
      'agent-insight-learning',
      taskContainer.parentElement,
      `<div style="font-size:13px;font-weight:800;color:#4F46E5;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px;">AI Adjustment</div>
       <p style="margin:0;font-size:14px;color:#111827;line-height:1.55;"><strong>${mode} ${escapeHtml(decision.recommended_topic || 'General Concepts')}</strong> because ${escapeHtml(decision.reason || '')}</p>`,
      taskContainer
    );
  }

  function injectResourcesTip(decision) {
    const banner = document.querySelector('.main-content .card.mb-20');
    if (!banner) return;

    const titleEl = banner.querySelector('[data-i18n="vid.ai_tip"]') || banner.querySelector('div[style*="font-size:15px"]');
    const textEl = banner.querySelector('p');
    const button = banner.querySelector('button');

    const state = getUserState();
    const exam = state.exam || 'JEE';
    const actionPrefix = decision.action === 'revise'
      ? 'Revise'
      : decision.action === 'advance'
        ? 'Advance'
        : 'Practice';

    if (titleEl) titleEl.textContent = `AI Study Tip · ${exam}`;
    if (textEl) {
      textEl.innerHTML = `${escapeHtml(actionPrefix)} <strong>${escapeHtml(decision.recommended_topic || 'General Concepts')}</strong> for ${escapeHtml(exam)}. ${escapeHtml(decision.reason || '')}`;
    }

    if (button) {
      button.textContent = `Show ${actionPrefix.toLowerCase()} set`;
      button.onclick = (e) => {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.value = decision.recommended_topic || '';
        }

        if (typeof window.filterVideos === 'function') {
          window.filterVideos();
        }

        if (window.Toast && typeof window.Toast.show === 'function') {
          window.Toast.show(`Showing ${actionPrefix.toLowerCase()} resources for ${decision.recommended_topic}`, 'info');
        }
      };
    }
  }

  function injectRevisionFocus(decision, userState) {
    const container = document.querySelector('.revision-container');
    const header = container ? container.querySelector('.header') : null;
    if (!container || !header) return;

    const weak = Array.isArray(userState.weak_topics) && userState.weak_topics.length
      ? userState.weak_topics
      : [decision.recommended_topic || 'General Concepts'];

    upsertCard(
      'agent-insight-revision',
      container,
      `<div style="font-size:13px;font-weight:800;color:#4F46E5;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px;">AI Revision Focus</div>
       <p style="margin:0 0 8px 0;font-size:15px;color:#111827;"><strong>Focus on:</strong> ${escapeHtml(weak.join(', '))}</p>
       <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.5;">${escapeHtml(decision.reason || '')}</p>`,
      header
    );
  }

  function isStudyPlanRequest(message) {
    const lower = String(message || '').toLowerCase();
    const triggers = [
      'study plan',
      'what should i study',
      'what to study',
      'help me plan',
      'create a plan',
      'make a plan',
      'suggest a plan',
      'revision plan',
      'schedule',
      'what next',
      'what should i do',
      'guide me',
      'roadmap',
    ];
    return triggers.some((t) => lower.includes(t));
  }

  function formatStudyPlan(decision) {
    const userState = getUserState();
    const weakTopics = userState.weak_topics.length > 0
      ? userState.weak_topics
      : [decision.recommended_topic || 'General Concepts'];

    return `AI Tutor Study Plan\n\n` +
      `Current Assessment: ${decision.insight}\n\n` +
      `Recommended Action: ${(decision.action || 'practice').charAt(0).toUpperCase() + (decision.action || 'practice').slice(1)}\n` +
      `Focus Topic: ${decision.recommended_topic || 'General Concepts'}\n` +
      `Difficulty Level: ${(decision.difficulty || 'medium').charAt(0).toUpperCase() + (decision.difficulty || 'medium').slice(1)}\n\n` +
      `Why: ${decision.reason}\n\n` +
      `${weakTopics.length > 0 ? `Weak Areas to Address: ${weakTopics.join(', ')}\n\n` : ''}` +
      `Suggested Steps:\n` +
      `1. ${decision.action === 'revise' ? `Review fundamentals of ${decision.recommended_topic}` : decision.action === 'practice' ? `Solve 10 problems on ${decision.recommended_topic}` : `Start advanced problems on ${decision.recommended_topic}`}\n` +
      `2. Watch one focused YouTube/resource lecture for this topic\n` +
      `3. Attempt a timed quiz and review mistakes\n` +
      `4. Re-check progress on dashboard`;
  }

  async function injectForContext(context) {
    try {
      const decision = await getDecision(context);
      if (!decision) return;

      const userState = getUserState();
      if (context !== 'chat') {
        // Avoid duplicate recommendation blocks on resources page.
        if (context !== 'resources') {
          renderAgentOSBar(decision);
          initDynamicTracking();
        }

        if (context === 'dashboard') injectDashboardInsight(decision);
        if (context === 'learning') injectLearningAdjustment(decision);
        if (context === 'resources') injectResourcesTip(decision);
        if (context === 'revision') injectRevisionFocus(decision, userState);
      } else {
        window._agentDecision = decision;
      }
    } catch (err) {
      console.warn('[AgentTutor] Auto-inject failed:', err.message);
    }
  }

  function autoInit() {
    syncQuizHistoryToBackend().catch(() => {});

    const page = window.location.pathname.split('/').pop() || 'dashboard.html';
    const contextMap = {
      'dashboard.html': 'dashboard',
      'learning.html': 'learning',
      'videos.html': 'resources',
      'revision.html': 'revision',
      'chat.html': 'chat',
    };

    const context = contextMap[page];
    if (!context) return;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => injectForContext(context));
    } else {
      setTimeout(() => injectForContext(context), 300);
    }
  }

  autoInit();

  return {
    getUserState,
    getDecision,
    recordQuizResult,
    syncQuizHistoryToBackend,
    isStudyPlanRequest,
    formatStudyPlan,
    MASCOT_SVG,
  };
})();
