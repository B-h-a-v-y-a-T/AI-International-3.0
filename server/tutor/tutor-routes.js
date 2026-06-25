// ═══════════════════════════════════════════════════════════════════════════════
// AI Tutor — Express API Router
// Multi-agent pipeline orchestrator with REST endpoints.
// ═══════════════════════════════════════════════════════════════════════════════

import express from 'express';
import { initTutorDB, getStudentState, upsertProfile, getWeakTopics, getStrongTopics, getMemories } from './tutor-db.js';
import * as LearningProfileAgent from './agents/learning-profile-agent.js';
import * as MemoryAgent from './agents/memory-agent.js';
import * as KnowledgeRetrievalAgent from './agents/knowledge-retrieval-agent.js';
import * as TutorAgent from './agents/tutor-agent.js';
import * as QuizGenerationAgent from './agents/quiz-generation-agent.js';
import * as ProgressAnalysisAgent from './agents/progress-analysis-agent.js';
import * as RecommendationAgent from './agents/recommendation-agent.js';

const router = express.Router();

// ── Initialize tutor system ──────────────────────────────────────────────────

export function initTutor({ geminiModel, groqClient }) {
  initTutorDB();

  const providers = { geminiModel, groqClient };
  TutorAgent.setProviders(providers);
  QuizGenerationAgent.setProviders(providers);
  RecommendationAgent.setProviders(providers);

  console.log('[AI Tutor] Module initialized with multi-agent architecture');
}

export function updateProviders({ geminiModel, groqClient }) {
  const providers = { geminiModel, groqClient };
  TutorAgent.setProviders(providers);
  QuizGenerationAgent.setProviders(providers);
  RecommendationAgent.setProviders(providers);
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/tutor/chat — Main tutor chat endpoint (multi-agent pipeline)
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/api/tutor/chat', async (req, res) => {
  try {
    const { userId, message, mode = 'ask', conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const effectiveUserId = userId || req.user?.email || 'anonymous';

    // ── STEP 1: Learning Profile Agent ─────────────────────────────────────
    const profileResult = await LearningProfileAgent.run({ userId: effectiveUserId });

    // ── STEP 2: Memory Agent — Retrieve context ────────────────────────────
    const memoryResult = await MemoryAgent.run({
      userId: effectiveUserId,
      message,
      topic: '',  // Topic will be identified by tutor
    });

    // ── STEP 3: Knowledge Retrieval Agent — RAG ────────────────────────────
    const knowledgeResult = await KnowledgeRetrievalAgent.run({
      message,
      topic: '',
    });

    // ── STEP 4: Detect Emotion (uses existing sentiment analysis) ──────────
    let emotion = 'neutral';
    try {
      // Simple rule-based emotion detection inline
      emotion = detectEmotion(message);
    } catch { /* default to neutral */ }

    // ── STEP 5: Tutor Agent — Generate response ────────────────────────────
    const studentState = {
      profile: profileResult.profile,
      weakTopics: profileResult.weakTopics,
      strongTopics: profileResult.strongTopics,
      recentMemories: memoryResult.recentMemories,
      metrics: profileResult.metrics,
    };

    const ragContext = knowledgeResult.available ? knowledgeResult.context : '';

    const tutorResponse = await TutorAgent.run({
      message,
      mode,
      studentState,
      emotion,
      ragContext,
      conversationHistory,
    });

    // ── STEP 6: Store Memory ───────────────────────────────────────────────
    await MemoryAgent.store(effectiveUserId, {
      interactionType: 'chat',
      topic: tutorResponse.topic || '',
      summary: truncate(message, 200) + ' → ' + truncate(tutorResponse.reply, 200),
      emotion: tutorResponse.emotion,
      mode,
      metadata: {
        followUpQuestions: tutorResponse.followUpQuestions,
        hasInteractiveBlocks: tutorResponse.interactiveBlocks?.length > 0,
      },
    });

    // ── STEP 7: Recommendation Agent ───────────────────────────────────────
    const recResult = await RecommendationAgent.run({ userId: effectiveUserId });

    // ── Return unified response ────────────────────────────────────────────
    res.json({
      response: tutorResponse.reply,
      emotion: tutorResponse.emotion,
      topic: tutorResponse.topic,
      mode,
      citations: [...(tutorResponse.citations || []), ...(knowledgeResult.citations || [])],
      followUpQuestions: tutorResponse.followUpQuestions || [],
      recommendedActions: [
        ...(tutorResponse.recommendedActions || []),
        ...(recResult.recommendations || []).map(r => r.message),
      ].slice(0, 5),
      interactiveBlocks: tutorResponse.interactiveBlocks || [],
      difficulty: tutorResponse.difficulty,
      source: tutorResponse.source,
      ragAvailable: knowledgeResult.available,
    });
  } catch (err) {
    console.error('[Tutor Chat] Error:', err);
    res.status(500).json({ error: 'Tutor chat failed', details: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/tutor/profile/:userId — Get student profile
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/api/tutor/profile/:userId', (req, res) => {
  try {
    const state = getStudentState(req.params.userId);
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/tutor/profile/:userId — Update student profile
// ═══════════════════════════════════════════════════════════════════════════════

router.put('/api/tutor/profile/:userId', (req, res) => {
  try {
    const allowed = ['learning_style', 'current_goal', 'target_exam', 'preferred_language', 'study_hours_per_day'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const profile = upsertProfile(req.params.userId, updates);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/tutor/dashboard/:userId — Full dashboard data
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/api/tutor/dashboard/:userId', async (req, res) => {
  try {
    const progressResult = await ProgressAnalysisAgent.run({ userId: req.params.userId });
    const profileResult = await LearningProfileAgent.run({ userId: req.params.userId });

    res.json({
      profile: profileResult.profile,
      weakTopics: profileResult.weakTopics,
      strongTopics: profileResult.strongTopics,
      metrics: profileResult.metrics,
      ...progressResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/tutor/quiz/generate — Generate adaptive quiz
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/api/tutor/quiz/generate', async (req, res) => {
  try {
    const { userId, topic, difficulty = 'medium', type = 'mcq', count = 5 } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const effectiveUserId = userId || req.user?.email || 'anonymous';
    const studentState = getStudentState(effectiveUserId);

    const result = await QuizGenerationAgent.run({
      userId: effectiveUserId,
      topic,
      difficulty,
      type,
      count,
      studentState,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/tutor/quiz/submit — Submit quiz and update mastery
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/api/tutor/quiz/submit', async (req, res) => {
  try {
    const { userId, topic, answers } = req.body;
    if (!topic || !answers) return res.status(400).json({ error: 'Topic and answers required' });

    const effectiveUserId = userId || req.user?.email || 'anonymous';
    const result = QuizGenerationAgent.submitQuiz(effectiveUserId, { topic, answers });

    // Store quiz memory
    await MemoryAgent.store(effectiveUserId, {
      interactionType: 'quiz',
      topic,
      summary: `Quiz on ${topic}: ${result.correct}/${result.total} correct (${(result.score * 100).toFixed(0)}%)`,
      mode: 'practice',
      metadata: { score: result.score, correct: result.correct, total: result.total },
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/tutor/study-plan/:userId — Get study plan
// POST /api/tutor/study-plan/generate — Generate new study plan
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/api/tutor/study-plan/:userId', async (req, res) => {
  try {
    const duration = parseInt(req.query.duration) || 7;
    const plan = await RecommendationAgent.generateStudyPlan(req.params.userId, duration);
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/tutor/study-plan/generate', async (req, res) => {
  try {
    const { userId, duration = 7 } = req.body;
    const effectiveUserId = userId || req.user?.email || 'anonymous';
    const plan = await RecommendationAgent.generateStudyPlan(effectiveUserId, duration);
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/tutor/weak-topics/:userId — Get weak topics
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/api/tutor/weak-topics/:userId', (req, res) => {
  try {
    const topics = getWeakTopics(req.params.userId);
    const suggestions = QuizGenerationAgent.suggestQuizTopics(req.params.userId);
    res.json({ weakTopics: topics, quizSuggestions: suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/tutor/memory/:userId — Get interaction history
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/api/tutor/memory/:userId', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const memories = getMemories(req.params.userId, { limit });
    res.json({ memories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Emotion Detection Helper ─────────────────────────────────────────────────

function detectEmotion(text) {
  const lower = text.toLowerCase();
  const emotions = {
    frustrated: /\b(frustrat|annoyed|irritat|ugh|can'?t understand|stuck|hate|impossible)\b/i,
    anxious: /\b(anxious|nervous|worried|stress|panic|scared|exam.*fear|fear.*exam)\b/i,
    confused: /\b(confused|don'?t get|unclear|what does|how does|doesn'?t make sense|lost)\b/i,
    sad: /\b(sad|depress|hopeless|cry|give up|fail|never learn)\b/i,
    tired: /\b(tired|exhausted|sleepy|burnout|can'?t focus|fatigue|drained)\b/i,
    angry: /\b(angry|furious|hate this|stupid|dumb|useless)\b/i,
    confident: /\b(easy|i know|i understand|got it|simple|makes sense|clear)\b/i,
    happy: /\b(happy|great|awesome|love|excited|wonderful|amazing|thank)\b/i,
  };

  for (const [emotion, pattern] of Object.entries(emotions)) {
    if (pattern.test(lower)) return emotion;
  }
  return 'neutral';
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

export default router;
