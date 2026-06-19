// ═══════════════════════════════════════════════════════════════════════════════
// Admin Quiz Engine — Central QuestionBank DB + Heatmap + Quiz Builder
// ═══════════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'question-bank.json');

// ── Unified Question Bank ────────────────────────────────────────────────────
// Canonical structure: { id, subject, topic, difficulty, question, options[], correctAnswer, explanation }

let questionBankDb = { questions: [], meta: {} };

function loadQuestionBankDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      questionBankDb = JSON.parse(data);
    } else {
      questionBankDb = { questions: [], meta: {} };
    }
  } catch (error) {
    console.error('Failed to load question bank DB:', error);
    questionBankDb = { questions: [], meta: {} };
  }
}

export function saveQuestionBankDb() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(questionBankDb, null, 2));
  } catch (error) {
    console.error('Failed to save question bank DB:', error);
  }
}

// Initial automatic load
loadQuestionBankDb();

// ── QuestionMeta Store (in-memory, synced to question-bank.json) ───────────────
export function loadQuestionMeta(meta) {
  // Merge legacy admin-state meta if provided
  if (meta && typeof meta === 'object') {
    questionBankDb.meta = { ...questionBankDb.meta, ...meta };
    saveQuestionBankDb();
  }
}

export function getQuestionMeta() {
  return { ...questionBankDb.meta };
}

function ensureQuestionMeta(questionId) {
  if (!questionBankDb.meta[questionId]) {
    questionBankDb.meta[questionId] = {
      usageCount: 0,
      successRate: 0,
      avgTime: 0,
      lastUsed: null,
      _totalCorrect: 0,
      _totalAttempts: 0,
      _totalTime: 0
    };
  }
  return questionBankDb.meta[questionId];
}

export function updateQuestionMeta(questionId, correct, timeTaken) {
  const meta = ensureQuestionMeta(questionId);
  meta._totalAttempts = (meta._totalAttempts || 0) + 1;
  meta._totalCorrect = (meta._totalCorrect || 0) + (correct ? 1 : 0);
  meta._totalTime = (meta._totalTime || 0) + Math.max(0, timeTaken || 0);
  meta.usageCount = meta._totalAttempts;
  meta.successRate = meta._totalAttempts ? Number((meta._totalCorrect / meta._totalAttempts).toFixed(4)) : 0;
  meta.avgTime = meta._totalAttempts ? Number((meta._totalTime / meta._totalAttempts).toFixed(2)) : 0;
  meta.lastUsed = new Date().toISOString();
  return { ...meta };
}

export function batchUpdateQuestionMeta(results) {
  for (const r of asArray(results)) {
    if (r && r.questionId) {
      updateQuestionMeta(r.questionId, !!r.correct, r.timeTaken || 0);
    }
  }
  saveQuestionBankDb();
  return { ...questionBankDb.meta };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_WEIGHT = { easy: 0.4, medium: 0.7, hard: 1.0 };

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value) {
  const n = toNumber(value, 0);
  return Math.max(0, Math.min(1, n));
}

function normalizeTopic(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function toDisplayTopic(value) {
  return normalizeTopic(value)
    .split(' ')
    .filter(Boolean)
    .map((t) => t[0].toUpperCase() + t.slice(1))
    .join(' ');
}

function uniqueTopics(values) {
  const out = [];
  const seen = new Set();
  for (const value of asArray(values)) {
    const topic = normalizeTopic(value);
    if (!topic || seen.has(topic)) continue;
    seen.add(topic);
    out.push(topic);
  }
  return out;
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function cosineSimilarity(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, magA = 0, magB = 0;
  for (const key of keys) {
    const va = toNumber(a[key], 0);
    const vb = toNumber(b[key], 0);
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function buildVector(text) {
  const freq = {};
  for (const token of tokenize(text)) {
    freq[token] = (freq[token] || 0) + 1;
  }
  return freq;
}

const TOPIC_INDEX = {};
const FLAT_QUESTION_BANK = [];

(function buildIndexes() {
  for (const q of questionBankDb.questions) {
    const normalizedTopic = normalizeTopic(q.topic || 'general');
    if (!TOPIC_INDEX[normalizedTopic]) {
      TOPIC_INDEX[normalizedTopic] = { easy: [], medium: [], hard: [], all: [] };
    }
    
    const normalized = {
      id: String(q.id || `qb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      subject: String(q.subject || 'physics'),
      topic: normalizedTopic,
      question: String(q.question || '').trim(),
      options: asArray(q.options).map((o) => String(o || '')),
      correctIndex: Math.max(0, Math.min(3, Math.floor(toNumber(q.correctIndex, 0)))),
      correctAnswer: asArray(q.options)[Math.max(0, Math.min(3, Math.floor(toNumber(q.correctIndex, 0))))] || '',
      explanation: String(q.explanation || ''),
      difficulty: String(q.difficulty || 'medium').toLowerCase(),
      source: 'question-bank'
    };
    FLAT_QUESTION_BANK.push(normalized);
    TOPIC_INDEX[normalizedTopic].all.push(normalized);
    const diff = normalized.difficulty;
    if (TOPIC_INDEX[normalizedTopic][diff]) {
      TOPIC_INDEX[normalizedTopic][diff].push(normalized);
    }
  }
})();

const VECTOR_INDEX = FLAT_QUESTION_BANK.map((q) => ({
  id: q.id,
  topic: q.topic,
  difficulty: q.difficulty,
  vector: buildVector(`${q.topic} ${q.question} ${(q.options || []).join(' ')}`)
}));

function rankBySimilarity(query, candidates) {
  const queryVector = buildVector(query);
  return candidates
    .map((c) => {
      const idx = VECTOR_INDEX.find((row) => row.id === c.id);
      const score = idx ? cosineSimilarity(queryVector, idx.vector) : 0;
      return { candidate: c, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((row) => row.candidate);
}

function normalizeQuestionShape(question, fallbackTopic = 'general') {
  const source = asObject(question);
  const options = asArray(source.options).map((x) => String(x || '')).slice(0, 4);
  while (options.length < 4) options.push(`Option ${options.length + 1}`);
  const ci = Math.max(0, Math.min(3, Math.floor(toNumber(source.correctIndex ?? source.correct, 0))));

  return {
    id: String(source.id || `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    subject: String(source.subject || 'general'),
    topic: normalizeTopic(source.topic || fallbackTopic || 'general'),
    question: String(source.question || source.q || 'Untitled question').trim(),
    options,
    correctIndex: ci,
    correctAnswer: options[ci] || '',
    explanation: String(source.explanation || ''),
    difficulty: String(source.difficulty || 'medium').toLowerCase(),
    source: String(source.source || 'admin')
  };
}

// ── Exports ──────────────────────────────────────────────────────────────────

export function getQuestionBankCatalog() {
  const topicCounts = {};
  for (const q of FLAT_QUESTION_BANK) {
    topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
  }
  const topics = Object.entries(topicCounts)
    .map(([topic, count]) => ({
      topic,
      displayTopic: toDisplayTopic(topic),
      subject: (TOPIC_INDEX[topic]?.all[0]?.subject) || 'general',
      count
    }))
    .sort((a, b) => a.displayTopic.localeCompare(b.displayTopic));

  return { totalQuestions: FLAT_QUESTION_BANK.length, topics };
}

export function queryQuestionBank(params = {}) {
  const topics = uniqueTopics(params.topics || []);
  const search = String(params.search || '').trim();
  const difficulty = String(params.difficulty || 'all').toLowerCase();
  const limit = Math.max(1, Math.min(200, Math.floor(toNumber(params.limit, 30))));

  let pool = FLAT_QUESTION_BANK.filter((q) => {
    if (topics.length && !topics.includes(normalizeTopic(q.topic))) return false;
    if (difficulty !== 'all' && q.difficulty !== difficulty) return false;
    return true;
  });

  if (search) {
    pool = rankBySimilarity(search, pool);
  }

  return pool.slice(0, limit).map((q) => ({ ...q }));
}

/**
 * Get questions sorted by priority for doubt quiz generation.
 * Prefers: high difficulty + low successRate from QuestionMeta.
 */
export function getQuestionsByPriority(topics, count = 8) {
  const normalizedTopics = uniqueTopics(topics);
  let pool = FLAT_QUESTION_BANK.filter((q) => {
    if (normalizedTopics.length && !normalizedTopics.includes(q.topic)) return false;
    return true;
  });

  pool.sort((a, b) => {
    const metaA = questionMetaStore[a.id] || {};
    const metaB = questionMetaStore[b.id] || {};
    const diffA = DIFFICULTY_WEIGHT[a.difficulty] || 0.6;
    const diffB = DIFFICULTY_WEIGHT[b.difficulty] || 0.6;
    const successA = toNumber(metaA.successRate, 0.5);
    const successB = toNumber(metaB.successRate, 0.5);
    // Low successRate is better for doubt quizzes (students struggling)
    // High difficulty is better
    const scoreA = (1 - successA) * 0.6 + diffA * 0.4;
    const scoreB = (1 - successB) * 0.6 + diffB * 0.4;
    return scoreB - scoreA;
  });

  return pool.slice(0, count).map((q) => normalizeQuestionShape(q, q.topic));
}

// ── Heatmap Generation ───────────────────────────────────────────────────────
// Formula: difficultyScore = (studentsWithWrongAnswers / totalStudentsAttempted) * 0.6
//                          + (incorrectAttempts / totalAttempts) * 0.4

export function generateClassHeatmap(studentPerformance = []) {
  const rows = asArray(studentPerformance);
  const aggregate = {};

  for (const rawRow of rows) {
    const row = asObject(rawRow);
    const topic = normalizeTopic(row.topic);
    if (!topic) continue;

    const attempts = Math.max(1, Math.floor(toNumber(row.attempts, 1)));
    const correct = Math.max(0, Math.min(attempts, Math.floor(toNumber(row.correct, 0))));
    const incorrect = attempts - correct;
    const timeTaken = Math.max(0, toNumber(row.timeTaken, 0));
    const userId = String(row.userId || row.email || '').trim();

    if (!aggregate[topic]) {
      aggregate[topic] = {
        topic,
        totalAttempts: 0,
        totalCorrect: 0,
        incorrectAttempts: 0,
        allStudents: new Set(),
        wrongStudents: new Set(),
        totalTimeTaken: 0,
        rowCount: 0,
        source: row.source || 'quiz'
      };
    }

    const bucket = aggregate[topic];
    bucket.totalAttempts += attempts;
    bucket.totalCorrect += correct;
    bucket.incorrectAttempts += incorrect;
    bucket.totalTimeTaken += timeTaken;
    bucket.rowCount += 1;

    if (userId) {
      bucket.allStudents.add(userId);
      if (incorrect > 0) {
        bucket.wrongStudents.add(userId);
      }
    }
  }

  return Object.values(aggregate)
    .map((t) => {
      const totalStudentsAttempted = t.allStudents.size || 1;
      const studentsWithWrongAnswers = t.wrongStudents.size;
      const totalAttempts = t.totalAttempts || 1;
      const incorrectAttempts = t.incorrectAttempts;
      const avgAccuracy = t.totalAttempts ? t.totalCorrect / t.totalAttempts : 0;

      const difficultyScore = clamp01(
        (studentsWithWrongAnswers / totalStudentsAttempted) * 0.6 +
        (incorrectAttempts / totalAttempts) * 0.4
      );

      return {
        topic: t.topic,
        displayTopic: toDisplayTopic(t.topic),
        difficultyScore: Number(difficultyScore.toFixed(4)),
        avgAccuracy: Number(avgAccuracy.toFixed(4)),
        failureRate: Number((studentsWithWrongAnswers / totalStudentsAttempted).toFixed(4)),
        attempts: t.totalAttempts,
        incorrectAttempts: t.incorrectAttempts,
        students: totalStudentsAttempted,
        studentsStruggling: studentsWithWrongAnswers,
        pctStruggling: Number(((studentsWithWrongAnswers / totalStudentsAttempted) * 100).toFixed(1)),
        avgTimeTaken: t.rowCount ? Number((t.totalTimeTaken / t.rowCount).toFixed(2)) : 0
      };
    })
    .sort((a, b) => b.difficultyScore - a.difficultyScore);
}

// ── Student Insight Generation ───────────────────────────────────────────────

export function getTopicStudentPerformance(studentPerformance = [], topic) {
  const rows = asArray(studentPerformance);
  const normalizedTarget = normalizeTopic(topic);
  const aggregate = {};

  for (const rawRow of rows) {
    const row = asObject(rawRow);
    const rowTopic = normalizeTopic(row.topic);
    if (!rowTopic || rowTopic !== normalizedTarget) continue;

    const attempts = Math.max(1, Math.floor(toNumber(row.attempts, 1)));
    const correct = Math.max(0, Math.min(attempts, Math.floor(toNumber(row.correct, 0))));
    const userId = String(row.userId || row.email || '').trim();

    if (!userId) continue;

    if (!aggregate[userId]) {
      aggregate[userId] = { userId, attempts: 0, correct: 0 };
    }
    aggregate[userId].attempts += attempts;
    aggregate[userId].correct += correct;
  }

  return Object.values(aggregate)
    .map((student) => ({
      userId: student.userId,
      attempts: student.attempts,
      accuracy: student.attempts ? Number((student.correct / student.attempts).toFixed(4)) : 0
    }))
    .filter((student) => student.accuracy < 1.0) // Only return students struggling
    .sort((a, b) => a.accuracy - b.accuracy); // Worst performance first
}

// ── Doubt Quiz Generation ────────────────────────────────────────────────────

export function generateDoubtQuiz(params = {}) {
  const selectedTopics = uniqueTopics(params.selectedTopics || []);
  const questionCount = Math.max(3, Math.min(30, Math.floor(toNumber(params.questionCount, 8))));
  const createdBy = String(params.createdBy || 'admin');
  const heatmap = generateClassHeatmap(params.studentPerformance || []);

  const weakTopics = heatmap.slice(0, Math.max(1, Math.min(6, questionCount))).map((x) => x.topic);
  const quizTopics = selectedTopics.length ? selectedTopics : weakTopics;

  // Use priority-based selection (low successRate + high difficulty)
  let selectedQuestions = getQuestionsByPriority(quizTopics, questionCount * 3);

  if (selectedQuestions.length < questionCount) {
    const fallback = queryQuestionBank({
      search: quizTopics.join(' '),
      difficulty: 'all',
      limit: questionCount * 6
    });
    const seen = new Set(selectedQuestions.map((q) => q.id));
    for (const q of fallback) {
      if (seen.has(q.id)) continue;
      selectedQuestions.push(normalizeQuestionShape(q, q.topic));
      seen.add(q.id);
      if (selectedQuestions.length >= questionCount * 2) break;
    }
  }

  selectedQuestions = selectedQuestions.slice(0, questionCount);

  return {
    id: `dq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'DoubtQuiz',
    title: String(params.title || 'AI Doubt Quiz'),
    topics: quizTopics,
    questions: selectedQuestions,
    createdBy,
    createdAt: new Date().toISOString(),
    editable: true,
    assignedTo: asArray(params.assignedTo || []),
    attempts: []
  };
}

export function buildAutoQuizQuestions(params = {}) {
  const topics = uniqueTopics(params.topics || []);
  const questionCount = Math.max(3, Math.min(40, Math.floor(toNumber(params.questionCount, 8))));
  const difficulty = String(params.difficulty || 'all').toLowerCase();

  let pool = queryQuestionBank({ topics, difficulty, search: params.search || '', limit: questionCount * 6 });

  if (pool.length < questionCount) {
    const fallback = queryQuestionBank({
      search: (topics.join(' ') || String(params.search || '')),
      difficulty: 'all',
      limit: questionCount * 8
    });
    const seen = new Set(pool.map((q) => q.id));
    for (const q of fallback) {
      if (seen.has(q.id)) continue;
      pool.push(q);
      seen.add(q.id);
      if (pool.length >= questionCount * 2) break;
    }
  }

  return pool.slice(0, questionCount).map((q) => normalizeQuestionShape(q, q.topic));
}

export function evaluateQuizSubmission(quiz, answers, fallbackTimeTaken = 0) {
  const quizObj = asObject(quiz);
  const questionList = asArray(quizObj.questions).map((q) => normalizeQuestionShape(q));
  const answerList = asArray(answers).map((x) => Math.floor(toNumber(x, -1)));

  let correctCount = 0;
  const wrongQuestionIds = [];
  const topicStats = {};
  const perQuestionResults = [];

  questionList.forEach((question, idx) => {
    const answer = answerList[idx] !== undefined ? answerList[idx] : -1;
    const isCorrect = answer === question.correctIndex;
    if (isCorrect) correctCount += 1;
    else wrongQuestionIds.push(question.id);

    const topic = normalizeTopic(question.topic || 'general');
    if (!topicStats[topic]) {
      topicStats[topic] = { topic, correct: 0, attempts: 0, timeTaken: 0 };
    }
    topicStats[topic].attempts += 1;
    if (isCorrect) topicStats[topic].correct += 1;

    perQuestionResults.push({
      questionId: question.id,
      correct: isCorrect,
      timeTaken: 0
    });
  });

  const total = questionList.length || 1;
  const score = Math.round((correctCount / total) * 100);
  const perQuestionTime = total ? Math.max(0, toNumber(fallbackTimeTaken, 0)) / total : 0;

  // Distribute time per question for meta updates
  perQuestionResults.forEach((r) => { r.timeTaken = perQuestionTime; });

  const topicBreakdown = Object.values(topicStats).map((row) => ({
    topic: row.topic,
    correct: row.correct,
    attempts: row.attempts,
    accuracy: row.attempts ? Number((row.correct / row.attempts).toFixed(4)) : 0,
    timeTaken: Number((perQuestionTime * row.attempts).toFixed(2))
  }));

  return {
    total,
    correct: correctCount,
    score,
    wrongQuestionIds,
    weakAreas: topicBreakdown.filter((x) => x.accuracy < 0.6).map((x) => x.topic),
    topicBreakdown,
    perQuestionResults
  };
}

export function sanitizeQuizForStudent(quiz) {
  const quizObj = asObject(quiz);
  return {
    ...quizObj,
    questions: asArray(quizObj.questions).map((q) => {
      const normalized = normalizeQuestionShape(q, q.topic);
      return {
        id: normalized.id,
        topic: normalized.topic,
        question: normalized.question,
        options: normalized.options,
        correct: normalized.correctIndex,
        correctIndex: normalized.correctIndex,
        difficulty: normalized.difficulty,
        source: normalized.source,
        explanation: normalized.explanation
      };
    })
  };
}

export function normalizeQuizPayload(payload = {}, defaults = {}) {
  const source = asObject(payload);
  const topics = uniqueTopics(source.topics || defaults.topics || []);
  const questions = asArray(source.questions).map((q) => normalizeQuestionShape(q, topics[0] || 'general'));

  return {
    id: String(source.id || defaults.id || `aq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    type: String(source.type || defaults.type || 'AdminQuiz'),
    title: String(source.title || defaults.title || 'Untitled Quiz').trim(),
    topics,
    difficulty: String(source.difficulty || defaults.difficulty || 'medium').toLowerCase(),
    questions,
    assignedTo: asArray(source.assignedTo || defaults.assignedTo || []),
    createdBy: String(source.createdBy || defaults.createdBy || 'admin'),
    createdAt: String(source.createdAt || defaults.createdAt || new Date().toISOString()),
    editable: source.editable !== undefined ? !!source.editable : (defaults.editable !== undefined ? !!defaults.editable : true),
    attempts: asArray(source.attempts || defaults.attempts || [])
  };
}

export function mapTopicsToDisplay(topics = []) {
  return uniqueTopics(topics).map((topic) => ({
    topic,
    displayTopic: toDisplayTopic(topic)
  }));
}

// Add custom question to the bank at runtime
export function addCustomQuestion(questionData) {
  const q = normalizeQuestionShape(questionData);
  q.id = q.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  q.source = 'custom';
  FLAT_QUESTION_BANK.push(q);
  const topic = normalizeTopic(q.topic);
  if (!TOPIC_INDEX[topic]) {
    TOPIC_INDEX[topic] = { easy: [], medium: [], hard: [], all: [] };
  }
  TOPIC_INDEX[topic].all.push(q);
  if (TOPIC_INDEX[topic][q.difficulty]) {
    TOPIC_INDEX[topic][q.difficulty].push(q);
  }
  VECTOR_INDEX.push({
    id: q.id,
    topic: q.topic,
    difficulty: q.difficulty,
    vector: buildVector(`${q.topic} ${q.question} ${q.options.join(' ')}`)
  });
  return q;
}
