// ═══════════════════════════════════════════════════════════════════════════════
// Recommendation Agent
// Generates personalized study recommendations and auto study plans.
// ═══════════════════════════════════════════════════════════════════════════════

import { getProfile, getWeakTopics, getStrongTopics, getMemories } from '../tutor-db.js';
import { buildStudyPlanPrompt } from '../prompts/index.js';

let _geminiModel = null;
let _groqClient = null;

export function setProviders({ geminiModel, groqClient }) {
  _geminiModel = geminiModel;
  _groqClient = groqClient;
}

export async function run(context) {
  const { userId } = context;

  const profile = getProfile(userId);
  const weakTopics = getWeakTopics(userId);
  const strongTopics = getStrongTopics(userId);

  // Generate immediate recommendations
  const recommendations = generateRecommendations(profile, weakTopics, strongTopics);

  return { recommendations };
}

// ── Generate Study Plan ──────────────────────────────────────────────────────

export async function generateStudyPlan(userId, duration = 7) {
  const profile = getProfile(userId);
  const weakTopics = getWeakTopics(userId);
  const strongTopics = getStrongTopics(userId);
  const memories = getMemories(userId, { limit: 50 });

  // Calculate learning velocity
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const recentCount = memories.filter(m => m.timestamp > sevenDaysAgo).length;
  const velocity = recentCount >= 35 ? 'fast' : recentCount >= 14 ? 'moderate' : 'slow';

  const prompt = buildStudyPlanPrompt({
    targetExam: profile?.target_exam || 'JEE',
    duration,
    weakTopics: weakTopics.map(t => t.topic),
    strongTopics: strongTopics.map(t => t.topic),
    studyHoursPerDay: profile?.study_hours_per_day || 2,
    learningVelocity: velocity,
  });

  // Try LLM
  let plan = null;

  if (_geminiModel) {
    try {
      const raw = await runGemini(prompt);
      plan = parsePlanResponse(raw);
    } catch (err) {
      console.error('[RecommendationAgent] Gemini error:', err.message?.slice(0, 80));
    }
  }

  if (!plan && _groqClient) {
    try {
      const raw = await runGroq(prompt);
      plan = parsePlanResponse(raw);
    } catch (err) {
      console.error('[RecommendationAgent] Groq error:', err.message?.slice(0, 80));
    }
  }

  if (!plan) {
    plan = generateFallbackPlan(profile, weakTopics, strongTopics, duration);
  }

  return plan;
}

// ── Generate Recommendations ─────────────────────────────────────────────────

function generateRecommendations(profile, weakTopics, strongTopics) {
  const recommendations = [];

  // Weak topic recommendations
  const topWeak = weakTopics.slice(0, 3);
  for (const wt of topWeak) {
    if (wt.weakness_score > 0.7) {
      recommendations.push({
        type: 'urgent_revision',
        topic: wt.topic,
        message: `🔴 ${wt.topic} needs urgent attention (${(wt.weakness_score * 100).toFixed(0)}% weakness)`,
        action: 'revise',
        priority: 'high',
      });
    } else if (wt.weakness_score > 0.4) {
      recommendations.push({
        type: 'practice',
        topic: wt.topic,
        message: `🟡 Practice more ${wt.topic} to strengthen your understanding`,
        action: 'practice',
        priority: 'medium',
      });
    }
  }

  // Streak recommendation
  if ((profile?.mastery_score || 0) > 0.5 && strongTopics.length > 0) {
    const nextLevel = strongTopics[strongTopics.length - 1];
    recommendations.push({
      type: 'challenge',
      topic: nextLevel.topic,
      message: `🟢 You're doing great in ${nextLevel.topic}! Try harder questions.`,
      action: 'exam',
      priority: 'low',
    });
  }

  // General recommendation if no specific ones
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'explore',
      topic: '',
      message: '💡 Start studying a new topic or take a diagnostic quiz!',
      action: 'learn',
      priority: 'medium',
    });
  }

  return recommendations.slice(0, 5);
}

// ── LLM Runners ──────────────────────────────────────────────────────────────

async function runGemini(prompt) {
  const result = await Promise.race([
    _geminiModel.generateContent(prompt),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000)),
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
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
  ]);
  return String(result?.choices?.[0]?.message?.content || '').trim();
}

// ── Parse Plan Response ──────────────────────────────────────────────────────

function parsePlanResponse(raw) {
  let text = String(raw || '').trim();
  text = text.replace(/^```json\s*/i, '').replace(/```$/g, '').trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.dailyPlan || parsed.planName) return parsed;
    } catch { /* fall through */ }
  }
  return null;
}

// ── Fallback Study Plan ──────────────────────────────────────────────────────

function generateFallbackPlan(profile, weakTopics, strongTopics, duration) {
  const exam = profile?.target_exam || 'JEE';
  const hours = profile?.study_hours_per_day || 2;

  const allTopics = [
    ...weakTopics.map(t => ({ name: t.topic, priority: 'high' })),
    ...strongTopics.map(t => ({ name: t.topic, priority: 'low' })),
  ];

  if (allTopics.length === 0) {
    allTopics.push(
      { name: 'Physics - Mechanics', priority: 'medium' },
      { name: 'Chemistry - Organic', priority: 'medium' },
      { name: 'Mathematics - Calculus', priority: 'medium' },
    );
  }

  const dailyPlan = [];
  for (let day = 1; day <= duration; day++) {
    const topicIndex = (day - 1) % allTopics.length;
    const topic = allTopics[topicIndex];

    dailyPlan.push({
      day,
      date: `Day ${day}`,
      tasks: [
        {
          time: '9:00 AM - 10:30 AM',
          subject: topic.name.split(' - ')[0] || topic.name,
          topic: topic.name,
          activity: day % 3 === 0 ? 'Quiz + Review' : 'Learn + Practice',
          priority: topic.priority,
          type: day % 3 === 0 ? 'quiz' : 'study',
        },
        {
          time: `10:45 AM - ${9 + hours}:00 PM`,
          subject: 'Revision',
          topic: allTopics[(topicIndex + 1) % allTopics.length].name,
          activity: 'Quick Revision',
          priority: 'medium',
          type: 'revision',
        },
      ],
      quizScheduled: day % 3 === 0,
      revisionTopics: [allTopics[(topicIndex + 1) % allTopics.length].name],
    });
  }

  return {
    planName: `${duration}-Day ${exam} Study Plan`,
    duration,
    dailyPlan,
    weeklyGoals: [
      'Complete all daily tasks',
      'Score 70%+ on practice quizzes',
      'Review weak topics twice',
    ],
    tips: [
      'Start with your weakest topic each day',
      'Take 10-minute breaks every 45 minutes',
      `Focus ${Math.round(hours * 0.6)} hours on weak topics, ${Math.round(hours * 0.4)} hours on revision`,
    ],
  };
}
