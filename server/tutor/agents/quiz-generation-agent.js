// ═══════════════════════════════════════════════════════════════════════════════
// Quiz Generation Agent
// Generates adaptive quizzes and updates mastery scores.
// ═══════════════════════════════════════════════════════════════════════════════

import { buildQuizGenerationPrompt } from '../prompts/index.js';
import { updateMasteryFromQuiz, getWeakTopics } from '../tutor-db.js';

let _geminiModel = null;
let _groqClient = null;

export function setProviders({ geminiModel, groqClient }) {
  _geminiModel = geminiModel;
  _groqClient = groqClient;
}

export async function run(context) {
  const { userId, topic, difficulty = 'medium', type = 'mcq', count = 5, studentState } = context;

  // Auto-detect difficulty from mastery if not specified
  let adaptedDifficulty = difficulty;
  if (difficulty === 'adaptive' && studentState) {
    const mastery = studentState.profile?.mastery_score || 0;
    if (mastery < 0.3) adaptedDifficulty = 'easy';
    else if (mastery < 0.7) adaptedDifficulty = 'medium';
    else adaptedDifficulty = 'hard';
  }

  // Build quiz prompt
  const prompt = buildQuizGenerationPrompt({
    topic,
    difficulty: adaptedDifficulty,
    type,
    count: Math.min(count, 15),
    studentState,
  });

  // Generate via LLM
  let questions = null;

  if (_geminiModel) {
    try {
      const raw = await runGemini(prompt);
      questions = parseQuizResponse(raw);
    } catch (err) {
      console.error('[QuizAgent] Gemini error:', err.message?.slice(0, 80));
    }
  }

  if (!questions && _groqClient) {
    try {
      const raw = await runGroq(prompt);
      questions = parseQuizResponse(raw);
    } catch (err) {
      console.error('[QuizAgent] Groq error:', err.message?.slice(0, 80));
    }
  }

  if (!questions) {
    questions = generateFallbackQuiz(topic, adaptedDifficulty, type, count);
  }

  return {
    questions,
    topic,
    difficulty: adaptedDifficulty,
    type,
    count: questions.length,
  };
}

// ── Submit Quiz Results ──────────────────────────────────────────────────────

export function submitQuiz(userId, results) {
  // results: { topic, answers: [{ questionIndex, userAnswer, correct }] }
  const { topic, answers } = results;
  if (!answers || !answers.length) return { score: 0, total: 0 };

  const correct = answers.filter(a => a.correct).length;
  const total = answers.length;
  const score = total > 0 ? correct / total : 0;

  // Update mastery
  updateMasteryFromQuiz(userId, [{ topic, correct, total }]);

  return { score, correct, total, mastery: score };
}

// ── Suggest Topics for Quiz ──────────────────────────────────────────────────

export function suggestQuizTopics(userId) {
  const weakTopics = getWeakTopics(userId);
  return weakTopics.slice(0, 5).map(t => ({
    topic: t.topic,
    weakness: t.weakness_score,
    attempts: t.attempts,
    suggestedDifficulty: t.weakness_score > 0.7 ? 'easy' : t.weakness_score > 0.4 ? 'medium' : 'hard',
  }));
}

// ── LLM Runners ──────────────────────────────────────────────────────────────

async function runGemini(prompt) {
  const result = await Promise.race([
    _geminiModel.generateContent(prompt),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
  ]);
  const response = await result.response;
  return String(response?.text?.() || '').trim();
}

async function runGroq(prompt) {
  const result = await Promise.race([
    _groqClient.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000)),
  ]);
  return String(result?.choices?.[0]?.message?.content || '').trim();
}

// ── Parse LLM Quiz Response ─────────────────────────────────────────────────

function parseQuizResponse(raw) {
  let text = String(raw || '').trim();
  text = text.replace(/^```json\s*/i, '').replace(/```$/g, '').trim();

  // Try to find JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fall through */ }
  }

  return null;
}

// ── Fallback Questions ───────────────────────────────────────────────────────

function generateFallbackQuiz(topic, difficulty, type, count) {
  const questions = [];
  for (let i = 0; i < Math.min(count, 5); i++) {
    questions.push({
      question: `Sample ${difficulty} question ${i + 1} about ${topic}`,
      type,
      difficulty,
      topic,
      options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
      answer: 0,
      explanation: `This is a placeholder question. The AI quiz generator is currently unavailable. Please try again.`,
      hint: 'This is a fallback question.',
    });
  }
  return questions;
}
