// ═══════════════════════════════════════════════════════════════════════════════
// AGENTIC AI TUTOR — Decision Engine
// Central intelligence layer that observes user behavior and guides learning.
// NOT a chatbot — a DECISION ENGINE.
// ═══════════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENT_STATE_FILE = path.join(__dirname, 'data', 'agent-state.json');

const TOPIC_UNIVERSE_BY_EXAM = {
  JEE: [
    'kinematics',
    'laws of motion',
    'work energy power',
    'thermodynamics',
    'electrostatics',
    'calculus',
    'probability',
    'organic chemistry',
    'chemical bonding',
  ],
  NEET: [
    'cell biology',
    'genetics',
    'human physiology',
    'photosynthesis',
    'thermodynamics',
    'electrostatics',
    'organic chemistry',
    'chemical bonding',
  ],
  CAT: [
    'arithmetic',
    'algebra',
    'geometry',
    'number system',
    'probability',
    'data interpretation',
    'logical reasoning',
    'reading comprehension',
  ],
};

const SUBJECT_TOPIC_MAP = {
  physics: ['kinematics', 'laws of motion', 'work energy power', 'thermodynamics', 'electrostatics'],
  chemistry: ['organic chemistry', 'chemical bonding', 'thermodynamics'],
  math: ['calculus', 'probability', 'algebra', 'geometry'],
  maths: ['calculus', 'probability', 'algebra', 'geometry'],
  biology: ['cell biology', 'genetics', 'human physiology', 'photosynthesis'],
  qa: ['arithmetic', 'algebra', 'number system', 'probability'],
  dilr: ['data interpretation', 'logical reasoning'],
  varc: ['reading comprehension'],
};

const ACTIONS = new Set(['revise', 'practice', 'advance']);
const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

// ── Persistent Agent State ───────────────────────────────────────────────────

function ensureAgentStateFile() {
  const dir = path.dirname(AGENT_STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(AGENT_STATE_FILE)) {
    fs.writeFileSync(AGENT_STATE_FILE, JSON.stringify({}, null, 2));
  }
}

function readAgentState() {
  ensureAgentStateFile();
  try {
    return JSON.parse(fs.readFileSync(AGENT_STATE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeAgentState(state) {
  ensureAgentStateFile();
  fs.writeFileSync(AGENT_STATE_FILE, JSON.stringify(state, null, 2));
}

function clamp01(value, fallback = 0.5) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function safeString(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function normalizeTopic(topic) {
  return safeString(topic)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toDisplayTopic(topic) {
  const clean = normalizeTopic(topic);
  if (!clean) return 'General Concepts';
  return clean
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function dedupeTopics(topics = []) {
  const out = [];
  const seen = new Set();
  for (const raw of topics) {
    const t = normalizeTopic(raw);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function mergeScores(baseScores = {}, incomingScores = {}) {
  const merged = {};
  const allSubjects = new Set([
    ...Object.keys(safeObject(baseScores)),
    ...Object.keys(safeObject(incomingScores)),
  ]);

  for (const subject of allSubjects) {
    const a = Number(baseScores[subject]);
    const b = Number(incomingScores[subject]);
    if (Number.isFinite(a) && Number.isFinite(b)) merged[subject] = Math.round((a + b) / 2);
    else if (Number.isFinite(a)) merged[subject] = Math.round(a);
    else if (Number.isFinite(b)) merged[subject] = Math.round(b);
  }

  return merged;
}

function scoreHistoryToRecent(scores = [], maxLen = 10) {
  if (!Array.isArray(scores)) return [];
  return scores
    .map((s) => clamp01(s))
    .slice(-maxLen);
}

function getScoresFromHistory(history = []) {
  const bySubject = {};
  for (const row of history) {
    const subject = normalizeTopic(row.subject || row.topic || 'general');
    const score01 = clamp01(row.score);
    if (!bySubject[subject]) bySubject[subject] = [];
    bySubject[subject].push(Math.round(score01 * 100));
  }

  const out = {};
  for (const [subject, vals] of Object.entries(bySubject)) {
    if (!vals.length) continue;
    out[subject] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  return out;
}

function mergeBanditState(baseBandit = {}, incomingBandit = {}) {
  const merged = {};
  const keys = new Set([
    ...Object.keys(safeObject(baseBandit)),
    ...Object.keys(safeObject(incomingBandit)),
  ]);

  for (const key of keys) {
    const topic = normalizeTopic(key);
    if (!topic) continue;

    const a = safeObject(baseBandit[key]);
    const b = safeObject(incomingBandit[key]);
    const shownA = Number(a.shown) || 0;
    const shownB = Number(b.shown) || 0;
    const shown = shownA + shownB;

    const rewardA = clamp01(a.reward, 0.5);
    const rewardB = clamp01(b.reward, 0.5);
    const reward = shown > 0
      ? ((rewardA * shownA) + (rewardB * shownB)) / Math.max(shown, 1)
      : rewardB;

    merged[topic] = {
      shown,
      reward: Number(reward.toFixed(4)),
      last_seen: b.last_seen || a.last_seen || null,
    };
  }

  return merged;
}

function topicTokens(text) {
  return normalizeTopic(text)
    .split(' ')
    .filter((w) => w.length > 2);
}

function sparseVector(text) {
  const vec = new Map();
  for (const token of topicTokens(text)) {
    vec.set(token, (vec.get(token) || 0) + 1);
  }
  const norm = Math.sqrt([...vec.values()].reduce((a, b) => a + (b * b), 0));
  if (norm > 0) {
    for (const [k, v] of vec.entries()) vec.set(k, v / norm);
  }
  return vec;
}

function cosineSparse(a, b) {
  if (!a.size || !b.size) return 0;
  let dot = 0;
  const small = a.size <= b.size ? a : b;
  const large = small === a ? b : a;
  for (const [k, v] of small.entries()) {
    dot += v * (large.get(k) || 0);
  }
  return dot;
}

function nearestTopics(queryTopic, candidates = [], limit = 3) {
  const q = normalizeTopic(queryTopic);
  if (!q) return [];
  const qVec = sparseVector(q);
  const scored = dedupeTopics(candidates)
    .map((t) => ({ topic: t, score: cosineSparse(qVec, sparseVector(t)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
  return scored;
}

function getExamUniverse(examName) {
  const exam = safeString(examName || 'JEE', 'JEE').toUpperCase();
  return TOPIC_UNIVERSE_BY_EXAM[exam] || TOPIC_UNIVERSE_BY_EXAM.JEE;
}

function inferSubjectTopics(scores = {}) {
  const out = [];
  for (const subject of Object.keys(safeObject(scores))) {
    const key = normalizeTopic(subject);
    if (SUBJECT_TOPIC_MAP[key]) out.push(...SUBJECT_TOPIC_MAP[key]);
  }
  return out;
}

function getTopicUniverse(userState) {
  const examUniverse = getExamUniverse(userState.exam);
  const weak = dedupeTopics(userState.weak_topics || []);
  const strong = dedupeTopics(userState.strong_topics || []);
  const subjectInferred = inferSubjectTopics(userState.scores || {});
  const banditTopics = Object.keys(safeObject(userState.bandit || {})).map((t) => normalizeTopic(t));

  const fromHistory = [];
  for (const row of Array.isArray(userState.quiz_history) ? userState.quiz_history : []) {
    const rowTopic = normalizeTopic(row.topic);
    if (rowTopic) fromHistory.push(rowTopic);
    const mistakes = Array.isArray(row.mistakes) ? row.mistakes : [];
    for (const m of mistakes) {
      const mt = normalizeTopic(m.topic || m.concept);
      if (mt) fromHistory.push(mt);
    }
  }

  const all = dedupeTopics([
    ...weak,
    ...strong,
    ...subjectInferred,
    ...banditTopics,
    ...fromHistory,
    ...examUniverse,
  ]);

  return all.length ? all : ['general concepts', 'problem solving', 'fundamentals'];
}

function pickBanditTopic(userState, context = 'dashboard') {
  const bandit = safeObject(userState.bandit || {});
  const weakSet = new Set(dedupeTopics(userState.weak_topics || []));
  const strongSet = new Set(dedupeTopics(userState.strong_topics || []));
  const candidates = getTopicUniverse(userState);

  let totalShown = 0;
  for (const t of candidates) totalShown += Number(safeObject(bandit[t]).shown) || 0;

  let best = candidates[0] || 'general concepts';
  let bestScore = -Infinity;

  for (const topic of candidates) {
    const node = safeObject(bandit[topic]);
    const shown = Math.max(0, Number(node.shown) || 0);
    const reward = clamp01(node.reward, 0.5);

    // Bandit objective: exploit weak/negative performance while still exploring unseen topics.
    const negativePressure = 1 - reward;
    const novelty = shown === 0
      ? 1
      : Math.sqrt(Math.log(totalShown + candidates.length + 1) / (shown + 1));
    const weakPressure = weakSet.has(topic) ? 1 : 0;
    const unseenBonus = shown === 0 ? 1 : 0;

    let score = (0.42 * negativePressure) + (0.28 * novelty) + (0.2 * weakPressure) + (0.1 * unseenBonus);

    if (strongSet.has(topic)) score -= 0.15;
    if (context === 'resources' && weakSet.has(topic)) score += 0.05;

    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }

  return {
    topic: best,
    score: Number(bestScore.toFixed(4)),
    total_candidates: candidates.length,
  };
}

function resolveRecommendedTopic(rawTopic, userState, context) {
  const universe = getTopicUniverse(userState);
  const banditPick = pickBanditTopic(userState, context);
  const normalizedRaw = normalizeTopic(rawTopic);

  let resolved = banditPick.topic;
  if (normalizedRaw) {
    if (universe.includes(normalizedRaw)) {
      resolved = normalizedRaw;
    } else {
      const nearest = nearestTopics(normalizedRaw, universe, 3);
      if (nearest.length && nearest[0].score >= 0.42) resolved = nearest[0].topic;
      else if (!/general concepts|general|overall|mixed/.test(normalizedRaw)) resolved = normalizedRaw;
    }
  }

  const mapped = nearestTopics(resolved, universe, 3).map((x) => toDisplayTopic(x.topic));
  return {
    topic: toDisplayTopic(resolved),
    mapped_topics: mapped,
    bandit: banditPick,
  };
}

function buildDefaultState() {
  return {
    scores: {},
    weak_topics: [],
    strong_topics: [],
    streak: 0,
    recent_scores: [],
    current_subject: '',
    exam: 'JEE',
    last_action: null,
    trend: 'unknown',
    confidence: 'medium',
    quiz_history: [],
    bandit: {},
  };
}

// ── User State Builder ───────────────────────────────────────────────────────

/**
 * Build a user_state from stored quiz data.
 * Can be called with client-provided data or read from server store.
 */
export function buildUserState(clientState = null, storedState = null) {
  const defaults = buildDefaultState();

  const client = safeObject(clientState);
  const stored = safeObject(storedState);

  const storedHistory = Array.isArray(stored.quiz_history) ? stored.quiz_history : [];
  const clientHistory = Array.isArray(client.quiz_history) ? client.quiz_history : [];
  const quizHistory = [...storedHistory, ...clientHistory].slice(-80);

  const storedRecent = scoreHistoryToRecent(stored.recent_scores, 10);
  const clientRecent = scoreHistoryToRecent(client.recent_scores, 10);
  const historyRecent = scoreHistoryToRecent(quizHistory.map((q) => q.score), 10);

  const recentScores = clientRecent.length
    ? clientRecent
    : storedRecent.length
      ? storedRecent
      : historyRecent;

  const mergedScores = mergeScores(
    mergeScores(getScoresFromHistory(storedHistory), safeObject(stored.scores)),
    mergeScores(getScoresFromHistory(clientHistory), safeObject(client.scores))
  );

  const weakTopics = dedupeTopics([
    ...(Array.isArray(stored.weak_topics) ? stored.weak_topics : []),
    ...(Array.isArray(client.weak_topics) ? client.weak_topics : []),
  ]);

  const strongTopics = dedupeTopics([
    ...(Array.isArray(stored.strong_topics) ? stored.strong_topics : []),
    ...(Array.isArray(client.strong_topics) ? client.strong_topics : []),
  ]);

  const bandit = mergeBanditState(stored.bandit, client.bandit);

  const merged = {
    ...defaults,
    scores: mergedScores,
    weak_topics: weakTopics,
    strong_topics: strongTopics,
    streak: Math.max(Number(stored.streak) || 0, Number(client.streak) || 0),
    recent_scores: recentScores,
    current_subject: safeString(client.current_subject || stored.current_subject),
    exam: safeString(client.exam || stored.exam, 'JEE') || 'JEE',
    last_action: safeString(client.last_action || stored.last_action) || null,
    quiz_history: quizHistory,
    bandit,
  };

  // If topic signals are empty, infer weak/strong from quiz history.
  if (!merged.weak_topics.length || !merged.strong_topics.length) {
    const fromHistory = merged.quiz_history.flatMap((q) => {
      const baseTopic = normalizeTopic(q.topic);
      const mistakes = Array.isArray(q.mistakes) ? q.mistakes : [];
      const wrong = mistakes
        .map((m) => normalizeTopic(m.topic || m.concept))
        .filter(Boolean)
        .map((t) => ({ topic: t, correct: false }));
      const self = baseTopic ? [{ topic: baseTopic, correct: clamp01(q.score) >= 0.8 }] : [];
      return [...wrong, ...self];
    });
    const { weak, strong } = extractWeakTopics(fromHistory);
    if (!merged.weak_topics.length) merged.weak_topics = weak;
    if (!merged.strong_topics.length) merged.strong_topics = strong;
  }

  merged.trend = detectTrend(merged.recent_scores);
  merged.confidence = computeConfidence(merged.recent_scores);

  return merged;
}

/**
 * Detect performance trend from recent scores.
 * Uses linear regression slope on the last 3–10 scores.
 * Returns: 'improving' | 'declining' | 'fluctuating' | 'stable' | 'unknown'
 */
export function detectTrend(recentScores = []) {
  if (!Array.isArray(recentScores) || recentScores.length < 3) return 'unknown';
  const cleanScores = recentScores.map((x) => clamp01(x));

  const n = cleanScores.length;
  // Simple linear regression slope
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += cleanScores[i];
    sumXY += i * cleanScores[i];
    sumX2 += i * i;
  }
  const denom = (n * sumX2 - sumX * sumX);
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;

  // Check fluctuation: count significant direction changes
  // Only count changes where the swing is meaningful (>0.05)
  const diffs = [];
  for (let i = 1; i < n; i++) {
    diffs.push(cleanScores[i] - cleanScores[i - 1]);
  }
  const signChanges = diffs.reduce((cnt, d, i) => {
    if (i > 0 && Math.abs(d) > 0.05 && Math.abs(diffs[i - 1]) > 0.05 &&
        Math.sign(d) !== Math.sign(diffs[i - 1])) cnt++;
    return cnt;
  }, 0);

  // If more than half the significant diffs change sign → fluctuating
  if (signChanges >= Math.floor(diffs.length / 2) && diffs.length >= 3) return 'fluctuating';

  if (slope > 0.03) return 'improving';
  if (slope < -0.03) return 'declining';
  return 'stable';
}

/**
 * Compute a confidence level from score consistency.
 * Returns: 'low' | 'medium' | 'high'
 */
export function computeConfidence(recentScores = []) {
  if (!Array.isArray(recentScores) || recentScores.length < 2) return 'medium';
  const cleanScores = recentScores.map((x) => clamp01(x));

  const avg = cleanScores.reduce((a, b) => a + b, 0) / cleanScores.length;
  // Standard deviation
  const variance = cleanScores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / cleanScores.length;
  const stdDev = Math.sqrt(variance);

  // High confidence = low variance + decent scores
  if (stdDev < 0.1 && avg >= 0.6) return 'high';
  if (stdDev > 0.2 || avg < 0.35) return 'low';
  return 'medium';
}

/**
 * Extract weak topics from quiz results.
 * A topic is "weak" if accuracy < 50%.
 */
export function extractWeakTopics(quizResults = []) {
  const topicStats = {};
  for (const result of quizResults) {
    const topic = normalizeTopic(result.topic || result.concept || 'general');
    if (!topic) continue;
    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
    topicStats[topic].total++;
    if (result.correct) topicStats[topic].correct++;
  }

  const weak = [];
  const strong = [];
  for (const [topic, stats] of Object.entries(topicStats)) {
    const accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
    if (accuracy < 0.5) weak.push(topic);
    else if (accuracy >= 0.8) strong.push(topic);
  }

  return { weak, strong };
}

function updateBanditForAttempt(user, topic, score01, mistakes = []) {
  if (!safeObject(user.bandit) || Array.isArray(user.bandit)) user.bandit = {};
  const mainTopic = normalizeTopic(topic) || 'general concepts';

  const touched = [mainTopic];
  for (const m of Array.isArray(mistakes) ? mistakes : []) {
    const mt = normalizeTopic(m.topic || m.concept);
    if (mt) touched.push(mt);
  }

  const uniqueTouched = dedupeTopics(touched);
  for (const t of uniqueTouched) {
    const prev = safeObject(user.bandit[t]);
    const shown = Math.max(0, Number(prev.shown) || 0);
    const oldReward = clamp01(prev.reward, 0.5);
    const isMain = t === mainTopic;
    const observedReward = isMain ? clamp01(score01) : 0.2;
    const reward = (oldReward * 0.7) + (observedReward * 0.3);

    user.bandit[t] = {
      shown: shown + 1,
      reward: Number(reward.toFixed(4)),
      last_seen: new Date().toISOString(),
    };
  }
}

function updateStreak(user) {
  const now = new Date();
  const prevIso = safeString(user.last_active);
  if (!prevIso) {
    user.streak = Math.max(1, Number(user.streak) || 0);
    return;
  }

  const prev = new Date(prevIso);
  if (Number.isNaN(prev.getTime())) {
    user.streak = Math.max(1, Number(user.streak) || 0);
    return;
  }

  const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d0 = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate());
  const diffDays = Math.round((d1 - d0) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) {
    user.streak = Math.max(1, Number(user.streak) || 0);
  } else if (diffDays === 1) {
    user.streak = (Number(user.streak) || 0) + 1;
  } else {
    user.streak = 1;
  }
}

/**
 * Record quiz results into the server-side agent state.
 */
export function recordQuizResults(userId, subject, topic, score, mistakes = []) {
  const state = readAgentState();
  if (!state[userId]) {
    state[userId] = {
      scores: {},
      weak_topics: [],
      strong_topics: [],
      recent_scores: [],
      quiz_history: [],
      streak: 0,
      last_active: null,
      bandit: {},
    };
  }

  const user = state[userId];
  if (!safeObject(user.bandit) || Array.isArray(user.bandit)) user.bandit = {};

  const subjectKey = normalizeTopic(subject) || 'general';
  const topicKey = normalizeTopic(topic || subjectKey) || 'general concepts';
  const score01 = clamp01(score);

  // Update subject score (running average)
  const prevScore = Number(user.scores[subjectKey]) || 0;
  const prevCount = user.quiz_history.filter(q => normalizeTopic(q.subject) === subjectKey).length;
  user.scores[subjectKey] = Math.round(((prevScore * prevCount) + (score01 * 100)) / (prevCount + 1));

  // Add to recent scores (keep last 10)
  user.recent_scores.push(score01);
  if (user.recent_scores.length > 10) user.recent_scores.shift();

  // Record quiz
  user.quiz_history.push({
    subject: subjectKey,
    topic: topicKey,
    score: score01,
    mistakes,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 50 quiz records
  if (user.quiz_history.length > 50) {
    user.quiz_history = user.quiz_history.slice(-50);
  }

  // Re-extract weak/strong topics from all history
  const allResults = user.quiz_history.flatMap(q =>
    (q.mistakes || []).map(m => ({ topic: m.topic || q.topic, correct: false }))
      .concat([{ topic: q.topic, correct: q.score >= 0.8 }])
  );
  const { weak, strong } = extractWeakTopics(allResults);
  user.weak_topics = weak;
  user.strong_topics = strong;

  updateBanditForAttempt(user, topicKey, score01, mistakes);
  updateStreak(user);

  user.last_active = new Date().toISOString();

  state[userId] = user;
  writeAgentState(state);

  return user;
}

export function ruleFallbackDecision(userState, context) {
  const state = buildUserState(userState);
  const weakTopics = state.weak_topics || [];
  const recentScores = state.recent_scores || [];
  const trend = userState.trend || detectTrend(recentScores);
  const confidence = userState.confidence || computeConfidence(recentScores);
  const lastAction = userState.last_action || null;

  // Calculate average recent score
  const avgScore = recentScores.length > 0
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    : 0.5;

  const resolvedTopic = resolveRecommendedTopic(weakTopics[0], state, context);
  const recommendedTopic = resolvedTopic.topic;

  // ── Determine base action from score ──
  let action, difficulty, insight, reason;

  if (avgScore < 0.4) {
    action = 'revise';
    difficulty = 'easy';
  } else if (avgScore <= 0.8) {
    action = 'practice';
    difficulty = 'medium';
  } else {
    action = 'advance';
    difficulty = 'hard';
  }

  // ── Trend modifiers ──
  if (trend === 'declining' && action === 'advance') {
    action = 'practice';
    difficulty = 'medium';
  }
  if (trend === 'fluctuating') {
    action = 'practice';
    difficulty = 'medium';
  }

  // ── Confidence modifiers ──
  if (confidence === 'low' && difficulty === 'hard') {
    difficulty = 'medium';
  }
  if (confidence === 'high' && difficulty === 'easy' && avgScore > 0.35) {
    difficulty = 'medium';
  }

  // ── Avoid repeating the same action consecutively ──
  if (lastAction && lastAction === action) {
    if (action === 'revise') {
      action = 'practice';
      difficulty = 'easy';
    } else if (action === 'advance') {
      action = 'practice';
      difficulty = 'medium';
    } else if (action === 'practice') {
      // Alternate based on trend
      action = trend === 'improving' ? 'advance' : 'revise';
      difficulty = trend === 'improving' ? 'medium' : 'easy';
    }
  }

  // ── Build insight and reason based on final action + trend ──
  const trendLabels = {
    improving: 'Your scores are trending upward',
    declining: 'Your recent scores have been dropping',
    fluctuating: 'Your scores are fluctuating',
    stable: 'Your performance is consistent',
    unknown: 'We are analyzing your progress',
  };
  const trendText = trendLabels[trend] || trendLabels.unknown;

  const confText = confidence === 'low'
    ? 'Building confidence is key right now.'
    : confidence === 'high'
      ? 'Your consistency shows strong confidence.'
      : '';

  if (action === 'revise') {
    insight = `${trendText}. Revisiting ${recommendedTopic} will rebuild your foundation.`;
    reason = `Your average recent score is ${Math.round(avgScore * 100)}%. This is below the 40% revision threshold, so we should repair fundamentals first.`;
  } else if (action === 'practice') {
    insight = `${trendText}. Practice on ${recommendedTopic} will improve consistency.`;
    reason = `Your average recent score is ${Math.round(avgScore * 100)}%, which falls in the 40%-80% practice band. ${trend === 'improving' ? 'Momentum is good, so focused practice is best.' : 'Targeted repetition will convert weak spots into strengths.'}`;
  } else {
    insight = `${trendText}. You are ready to advance with harder ${recommendedTopic} problems.`;
    reason = `Your average recent score is ${Math.round(avgScore * 100)}%, above the 80% advancement threshold. Increasing difficulty will speed up mastery.`;
  }

  return {
    insight: insight.replace(/\s+/g, ' ').trim(),
    action,
    reason,
    recommended_topic: recommendedTopic,
    difficulty,
    trend,
    confidence,
    mapped_topics: resolvedTopic.mapped_topics,
    bandit: resolvedTopic.bandit,
    source: 'rule-fallback',
  };
}

// ── Context-Aware Prompt Builder ─────────────────────────────────────────────

function buildAgentPrompt(userState, context) {
  const contextDescriptions = {
    dashboard: 'The student is on their main dashboard, looking at an overview of their progress. Give a motivational insight and clear next step.',
    learning: 'The student is on their learning path page, viewing modules and progress. Suggest whether to revisit a module or move forward.',
    resources: 'The student is browsing study resources and videos. Recommend the most impactful topic to study right now.',
    revision: 'The student is about to do revision. Tell them which topic to focus on and why.',
    chat: 'The student is asking for a study plan via the AI tutor chat. Create a structured, actionable recommendation.',
  };

  const contextGuide = contextDescriptions[context] || contextDescriptions.dashboard;

  const trend = userState.trend || 'unknown';
  const confidence = userState.confidence || 'medium';
  const lastAction = userState.last_action || 'none';
  const banditTopic = pickBanditTopic(userState, context).topic;

  return `You are an intelligent AI tutor decision engine for an Indian competitive exam preparation platform (JEE/NEET/CAT).

STUDENT PERFORMANCE DATA:
- Subject scores: ${JSON.stringify(userState.scores || {})}
- Weak topics: ${JSON.stringify(userState.weak_topics || [])}
- Strong topics: ${JSON.stringify(userState.strong_topics || [])}
- Current streak: ${userState.streak || 0} days
- Recent quiz scores (0-1 scale): ${JSON.stringify(userState.recent_scores || [])}
- Performance trend: ${trend}
- Confidence level: ${confidence}
- Last action given: ${lastAction}
- Bandit recommended topic (favor weak + unseen): ${banditTopic}
- Exam target: ${userState.exam || 'JEE'}

CURRENT CONTEXT: ${context}
${contextGuide}

DECISION RULES:
1. If recent scores average < 0.4 → recommend "revise" with prerequisite/easy topic
2. If recent scores average 0.4-0.8 → recommend "practice" at current level
3. If recent scores average > 0.8 → recommend "advance" to harder material
4. Use bandit behavior: prioritize weak/negative topics, but also occasionally pick unseen topics.
4. TREND AWARENESS:
   - If "improving": give credit, only suggest revise if truly needed
   - If "declining": pull back difficulty, favor revise or practice
   - If "fluctuating": recommend practice for consistency
5. AVOID REPETITION: The last action was "${lastAction}". Do NOT repeat the same action unless the data strongly demands it. Vary your guidance.
6. CONFIDENCE AWARENESS:
   - If "low": avoid hard difficulty, be more supportive
   - If "high": can push harder, be more ambitious
7. Be encouraging but honest

Respond with ONLY this exact JSON structure (no markdown, no extra text):
{
  "insight": "A short, punchy 1-sentence personalized insight (max 14 words) referencing their trend to fit in a top bar",
  "action": "revise" or "practice" or "advance",
  "reason": "A clear 1-2 sentence explanation of WHY, referencing trend/confidence",
  "recommended_topic": "The specific topic to focus on",
  "difficulty": "easy" or "medium" or "hard"
}`;
}

// ── LLM-Powered Decision Engine ──────────────────────────────────────────────

/**
 * Get an agentic decision using Groq LLM.
 * Falls back to rule-based if LLM fails.
 *
 * @param {object} groqClient - The initialized Groq client
 * @param {object} userState - The user's performance state
 * @param {string} context - Page context: dashboard|learning|resources|revision|chat
 * @returns {object} Decision JSON
 */
export async function getAgentDecision(groqClient, userState, context) {
  const safeContext = ['dashboard', 'learning', 'resources', 'revision', 'chat'].includes(context)
    ? context
    : 'dashboard';
  const state = buildUserState(userState);
  const fallback = ruleFallbackDecision(state, safeContext);

  // If no Groq client, use rule-based fallback immediately
  if (!groqClient) {
    console.log('[Agent] No Groq client — using rule-based fallback');
    return fallback;
  }

  try {
    const prompt = buildAgentPrompt(state, safeContext);

    const response = await Promise.race([
      groqClient.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Agent timeout')), 6000)),
    ]);

    const raw = (response.choices[0]?.message?.content || '').trim();

    // Clean LLM response — strip ```json wrappers
    let cleaned = raw;
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) cleaned = fenceMatch[1].trim();

    // Find JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in agent response');

    // Try parsing directly first, then sanitize if needed
    let decision;
    try {
      decision = JSON.parse(jsonMatch[0]);
    } catch {
      // Sanitize problematic control characters but preserve valid JSON
      const sanitized = jsonMatch[0]
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\t/g, ' ');
      decision = JSON.parse(sanitized);
    }

    // Validate required fields
    const resolved = resolveRecommendedTopic(decision.recommended_topic, state, safeContext);

    const action = ACTIONS.has(String(decision.action || '').toLowerCase())
      ? String(decision.action).toLowerCase()
      : fallback.action;
    const difficulty = DIFFICULTIES.has(String(decision.difficulty || '').toLowerCase())
      ? String(decision.difficulty).toLowerCase()
      : fallback.difficulty;

    // Hard guardrails keep the decision policy deterministic even if the LLM drifts.
    const recent = Array.isArray(state.recent_scores) && state.recent_scores.length
      ? state.recent_scores.map((s) => clamp01(s, 0.5))
      : [0.5];
    const avgScore = recent.reduce((a, b) => a + b, 0) / recent.length;

    let finalAction = action;
    let finalDifficulty = difficulty;
    const trend = state.trend || detectTrend(recent);

    if (avgScore < 0.4) {
      finalAction = 'revise';
      if (finalDifficulty === 'hard') finalDifficulty = 'easy';
    } else if (avgScore <= 0.8) {
      if (state.trend !== 'improving' && finalAction === 'advance') {
        finalAction = 'practice';
      }
    } else {
      if (finalAction === 'revise') finalAction = 'practice';
      if (finalDifficulty === 'easy') finalDifficulty = 'medium';
    }

    // Keep fluctuating performance in a stabilization loop.
    if (trend === 'fluctuating') {
      finalAction = 'practice';
      if (finalDifficulty === 'hard') finalDifficulty = 'medium';
    }

    const finalDecision = {
      insight: safeString(decision.insight) || fallback.insight,
      action: finalAction,
      reason: safeString(decision.reason) || fallback.reason,
      recommended_topic: resolved.topic || fallback.recommended_topic,
      difficulty: finalDifficulty,
      trend: state.trend || 'unknown',
      confidence: state.confidence || 'medium',
      mapped_topics: resolved.mapped_topics || fallback.mapped_topics || [],
      bandit: resolved.bandit || fallback.bandit,
      source: 'groq-ai',
    };

    if (!finalDecision.insight || !finalDecision.reason) return fallback;
    return finalDecision;

  } catch (err) {
    console.error('[Agent] LLM decision failed:', err.message?.slice(0, 100));
    return fallback;
  }
}

// ── Server-Side State Access ─────────────────────────────────────────────────

export function getStoredUserState(userId) {
  const state = readAgentState();
  return state[userId] || null;
}

export function updateStoredUserState(userId, partialState) {
  const state = readAgentState();
  if (!state[userId]) {
    state[userId] = {
      scores: {},
      weak_topics: [],
      strong_topics: [],
      recent_scores: [],
      quiz_history: [],
      streak: 0,
      last_active: null,
      bandit: {},
    };
  }
  state[userId] = buildUserState(partialState, state[userId]);
  state[userId].last_active = new Date().toISOString();
  writeAgentState(state);
  return state[userId];
}
