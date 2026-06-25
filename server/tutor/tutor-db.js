// ═══════════════════════════════════════════════════════════════════════════════
// AI Tutor — SQLite Database Layer
// Manages student profiles, memory, weak/strong topics for personalized tutoring.
// ═══════════════════════════════════════════════════════════════════════════════

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'data', 'tutor.db');

let db = null;

// ── Initialization ───────────────────────────────────────────────────────────

export function initTutorDB() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS student_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      learning_style TEXT DEFAULT 'visual',
      current_goal TEXT DEFAULT '',
      target_exam TEXT DEFAULT 'JEE',
      confidence_score REAL DEFAULT 0.5,
      mastery_score REAL DEFAULT 0.0,
      risk_score REAL DEFAULT 0.0,
      preferred_language TEXT DEFAULT 'English',
      study_hours_per_day REAL DEFAULT 2.0,
      last_updated TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS student_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      interaction_type TEXT NOT NULL,
      topic TEXT DEFAULT '',
      summary TEXT NOT NULL,
      emotion TEXT DEFAULT 'neutral',
      mode TEXT DEFAULT 'ask',
      metadata TEXT DEFAULT '{}',
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_memory_user ON student_memory(user_id);
    CREATE INDEX IF NOT EXISTS idx_memory_topic ON student_memory(topic);

    CREATE TABLE IF NOT EXISTS weak_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      weakness_score REAL DEFAULT 0.5,
      attempts INTEGER DEFAULT 0,
      correct INTEGER DEFAULT 0,
      incorrect INTEGER DEFAULT 0,
      last_seen TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, topic)
    );

    CREATE TABLE IF NOT EXISTS strong_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      mastery_score REAL DEFAULT 0.0,
      UNIQUE(user_id, topic)
    );
  `);

  console.log('[Tutor DB] Initialized successfully');
  return db;
}

function getDB() {
  if (!db) initTutorDB();
  return db;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

export function getProfile(userId) {
  const row = getDB().prepare('SELECT * FROM student_profile WHERE user_id = ?').get(userId);
  return row || null;
}

export function upsertProfile(userId, data = {}) {
  const existing = getProfile(userId);
  if (existing) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (key === 'user_id' || key === 'id') continue;
      fields.push(`${key} = ?`);
      values.push(val);
    }
    if (fields.length === 0) return existing;
    fields.push('last_updated = datetime(\'now\')');
    values.push(userId);
    getDB().prepare(`UPDATE student_profile SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
    return getProfile(userId);
  }

  const cols = ['user_id'];
  const placeholders = ['?'];
  const vals = [userId];

  for (const [key, val] of Object.entries(data)) {
    if (key === 'user_id' || key === 'id') continue;
    cols.push(key);
    placeholders.push('?');
    vals.push(val);
  }

  getDB().prepare(
    `INSERT INTO student_profile (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`
  ).run(...vals);

  return getProfile(userId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT MEMORY
// ═══════════════════════════════════════════════════════════════════════════════

export function addMemory(userId, { interactionType, topic = '', summary, emotion = 'neutral', mode = 'ask', metadata = {} }) {
  getDB().prepare(`
    INSERT INTO student_memory (user_id, interaction_type, topic, summary, emotion, mode, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, interactionType, topic, summary, emotion, mode, JSON.stringify(metadata));
}

export function getMemories(userId, { limit = 20, topic = null, interactionType = null } = {}) {
  let query = 'SELECT * FROM student_memory WHERE user_id = ?';
  const params = [userId];

  if (topic) {
    query += ' AND topic = ?';
    params.push(topic);
  }
  if (interactionType) {
    query += ' AND interaction_type = ?';
    params.push(interactionType);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  const rows = getDB().prepare(query).all(...params);
  return rows.map(r => ({ ...r, metadata: JSON.parse(r.metadata || '{}') }));
}

export function getRecentTopics(userId, limit = 10) {
  return getDB().prepare(`
    SELECT DISTINCT topic FROM student_memory
    WHERE user_id = ? AND topic != ''
    ORDER BY timestamp DESC LIMIT ?
  `).all(userId, limit).map(r => r.topic);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEAK TOPICS
// ═══════════════════════════════════════════════════════════════════════════════

export function upsertWeakTopic(userId, topic, { weaknessScore, attempts, correct, incorrect } = {}) {
  const existing = getDB().prepare(
    'SELECT * FROM weak_topics WHERE user_id = ? AND topic = ?'
  ).get(userId, topic);

  if (existing) {
    const newAttempts = (existing.attempts || 0) + (attempts || 0);
    const newCorrect = (existing.correct || 0) + (correct || 0);
    const newIncorrect = (existing.incorrect || 0) + (incorrect || 0);
    const score = weaknessScore !== undefined
      ? weaknessScore
      : (newAttempts > 0 ? 1 - (newCorrect / newAttempts) : existing.weakness_score);

    getDB().prepare(`
      UPDATE weak_topics
      SET weakness_score = ?, attempts = ?, correct = ?, incorrect = ?, last_seen = datetime('now')
      WHERE user_id = ? AND topic = ?
    `).run(score, newAttempts, newCorrect, newIncorrect, userId, topic);
  } else {
    const score = weaknessScore !== undefined ? weaknessScore : 0.5;
    getDB().prepare(`
      INSERT INTO weak_topics (user_id, topic, weakness_score, attempts, correct, incorrect)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, topic, score, attempts || 0, correct || 0, incorrect || 0);
  }
}

export function getWeakTopics(userId) {
  return getDB().prepare(
    'SELECT * FROM weak_topics WHERE user_id = ? ORDER BY weakness_score DESC'
  ).all(userId);
}

export function removeWeakTopic(userId, topic) {
  getDB().prepare('DELETE FROM weak_topics WHERE user_id = ? AND topic = ?').run(userId, topic);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRONG TOPICS
// ═══════════════════════════════════════════════════════════════════════════════

export function upsertStrongTopic(userId, topic, masteryScore) {
  const existing = getDB().prepare(
    'SELECT * FROM strong_topics WHERE user_id = ? AND topic = ?'
  ).get(userId, topic);

  if (existing) {
    getDB().prepare(
      'UPDATE strong_topics SET mastery_score = ? WHERE user_id = ? AND topic = ?'
    ).run(masteryScore, userId, topic);
  } else {
    getDB().prepare(
      'INSERT INTO strong_topics (user_id, topic, mastery_score) VALUES (?, ?, ?)'
    ).run(userId, topic, masteryScore);
  }

  // If mastery is high enough, remove from weak topics
  if (masteryScore >= 0.8) {
    removeWeakTopic(userId, topic);
  }
}

export function getStrongTopics(userId) {
  return getDB().prepare(
    'SELECT * FROM strong_topics WHERE user_id = ? ORDER BY mastery_score DESC'
  ).all(userId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSITE STATE — Full student state for agent pipeline
// ═══════════════════════════════════════════════════════════════════════════════

export function getStudentState(userId) {
  const profile = getProfile(userId) || upsertProfile(userId);
  const weakTopics = getWeakTopics(userId);
  const strongTopics = getStrongTopics(userId);
  const recentMemories = getMemories(userId, { limit: 10 });
  const recentTopics = getRecentTopics(userId, 10);

  // Calculate aggregate metrics
  const totalAttempts = weakTopics.reduce((sum, t) => sum + t.attempts, 0);
  const totalCorrect = weakTopics.reduce((sum, t) => sum + t.correct, 0);
  const avgMastery = strongTopics.length > 0
    ? strongTopics.reduce((sum, t) => sum + t.mastery_score, 0) / strongTopics.length
    : 0;

  return {
    profile,
    weakTopics,
    strongTopics,
    recentMemories,
    recentTopics,
    metrics: {
      totalAttempts,
      totalCorrect,
      accuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
      averageMastery: avgMastery,
      weakTopicCount: weakTopics.length,
      strongTopicCount: strongTopics.length,
      memoryCount: recentMemories.length,
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE MASTERY AFTER QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

export function updateMasteryFromQuiz(userId, topicScores) {
  // topicScores: [{ topic, correct, total }]
  for (const { topic, correct, total } of topicScores) {
    if (!topic || !total) continue;
    const score = correct / total;

    if (score >= 0.7) {
      upsertStrongTopic(userId, topic, score);
    }
    if (score < 0.6) {
      upsertWeakTopic(userId, topic, {
        weaknessScore: 1 - score,
        attempts: total,
        correct,
        incorrect: total - correct,
      });
    }
  }

  // Recalculate profile mastery
  const strongTopics = getStrongTopics(userId);
  const avgMastery = strongTopics.length > 0
    ? strongTopics.reduce((sum, t) => sum + t.mastery_score, 0) / strongTopics.length
    : 0;

  upsertProfile(userId, { mastery_score: avgMastery });
}
