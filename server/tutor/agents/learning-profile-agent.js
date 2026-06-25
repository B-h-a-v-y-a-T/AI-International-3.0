// ═══════════════════════════════════════════════════════════════════════════════
// Learning Profile Agent
// Loads/creates student profiles, computes learning metrics.
// ═══════════════════════════════════════════════════════════════════════════════

import { getProfile, upsertProfile, getWeakTopics, getStrongTopics, getMemories } from '../tutor-db.js';

export async function run(context) {
  const { userId } = context;

  // Ensure profile exists
  let profile = getProfile(userId);
  if (!profile) {
    profile = upsertProfile(userId, {
      target_exam: context.targetExam || 'JEE',
      learning_style: context.learningStyle || 'visual',
    });
  }

  const weakTopics = getWeakTopics(userId);
  const strongTopics = getStrongTopics(userId);
  const memories = getMemories(userId, { limit: 20 });

  // Compute learning velocity (interactions per day over last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentMemories = memories.filter(m => m.timestamp > sevenDaysAgo);
  const learningVelocity = recentMemories.length / 7;

  // Compute retention score (ratio of strong topics to total topics attempted)
  const totalTopics = new Set([
    ...weakTopics.map(t => t.topic),
    ...strongTopics.map(t => t.topic),
  ]).size;
  const retentionScore = totalTopics > 0 ? strongTopics.length / totalTopics : 0;

  // Compute knowledge gap score (weighted average of weakness scores)
  const knowledgeGapScore = weakTopics.length > 0
    ? weakTopics.reduce((sum, t) => sum + t.weakness_score, 0) / weakTopics.length
    : 0;

  // Compute overall confidence (based on recent quiz performance)
  const quizMemories = memories.filter(m => m.interaction_type === 'quiz');
  let confidenceScore = profile.confidence_score;
  if (quizMemories.length > 0) {
    const recentScores = quizMemories.slice(0, 5).map(m => {
      try {
        const meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
        return meta?.score || 0;
      } catch { return 0; }
    });
    confidenceScore = recentScores.length > 0
      ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
      : profile.confidence_score;
  }

  // Update profile with computed metrics
  upsertProfile(userId, {
    confidence_score: Math.min(1, Math.max(0, confidenceScore)),
    mastery_score: retentionScore,
    risk_score: knowledgeGapScore > 0.6 ? Math.min(1, knowledgeGapScore) : profile.risk_score,
  });

  return {
    profile: getProfile(userId),
    weakTopics,
    strongTopics,
    metrics: {
      learningVelocity,
      retentionScore,
      knowledgeGapScore,
      confidenceScore,
      totalTopicsStudied: totalTopics,
      recentInteractionCount: recentMemories.length,
    },
  };
}
