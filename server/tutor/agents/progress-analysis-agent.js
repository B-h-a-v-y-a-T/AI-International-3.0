// ═══════════════════════════════════════════════════════════════════════════════
// Progress Analysis Agent
// Analyzes performance trends, learning velocity, retention, and risk.
// ═══════════════════════════════════════════════════════════════════════════════

import { getProfile, getWeakTopics, getStrongTopics, getMemories } from '../tutor-db.js';

export async function run(context) {
  const { userId } = context;

  const profile = getProfile(userId);
  const weakTopics = getWeakTopics(userId);
  const strongTopics = getStrongTopics(userId);
  const allMemories = getMemories(userId, { limit: 100 });

  // ── Daily progress (last 7 days) ───────────────────────────────────────────
  const dailyProgress = computeDailyProgress(allMemories, 7);

  // ── Study streak ───────────────────────────────────────────────────────────
  const studyStreak = computeStudyStreak(allMemories);

  // ── Topic mastery heatmap data ─────────────────────────────────────────────
  const masteryHeatmap = buildMasteryHeatmap(weakTopics, strongTopics);

  // ── Confidence trend (last 10 quizzes) ─────────────────────────────────────
  const confidenceTrend = computeConfidenceTrend(allMemories);

  // ── Risk analysis ──────────────────────────────────────────────────────────
  const riskAnalysis = analyzeRisk(weakTopics, allMemories, profile);

  // ── Learning velocity ──────────────────────────────────────────────────────
  const learningVelocity = computeLearningVelocity(allMemories);

  // ── Retention score ────────────────────────────────────────────────────────
  const retentionScore = computeRetentionScore(weakTopics, strongTopics);

  return {
    dailyProgress,
    studyStreak,
    masteryHeatmap,
    confidenceTrend,
    riskAnalysis,
    learningVelocity,
    retentionScore,
    summary: {
      totalInteractions: allMemories.length,
      weakTopicCount: weakTopics.length,
      strongTopicCount: strongTopics.length,
      overallMastery: profile?.mastery_score || 0,
      overallConfidence: profile?.confidence_score || 0.5,
      riskLevel: riskAnalysis.level,
    },
  };
}

// ── Compute Daily Progress ───────────────────────────────────────────────────

function computeDailyProgress(memories, days) {
  const result = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayMemories = memories.filter(m => {
      const mDate = (m.timestamp || '').split('T')[0].split(' ')[0];
      return mDate === dateStr;
    });

    result.push({
      date: dateStr,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      interactions: dayMemories.length,
      quizzes: dayMemories.filter(m => m.interaction_type === 'quiz').length,
      studyTime: dayMemories.length * 5, // Estimate: ~5 min per interaction
    });
  }

  return result;
}

// ── Compute Study Streak ─────────────────────────────────────────────────────

function computeStudyStreak(memories) {
  if (!memories.length) return 0;

  const dates = new Set();
  memories.forEach(m => {
    const d = (m.timestamp || '').split('T')[0].split(' ')[0];
    if (d) dates.add(d);
  });

  const sortedDates = [...dates].sort().reverse();
  if (!sortedDates.length) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];

  // Check if studied today or yesterday
  if (sortedDates[0] !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (sortedDates[0] !== yesterday) return 0;
  }

  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    if (sortedDates.includes(expectedDate)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ── Mastery Heatmap ──────────────────────────────────────────────────────────

function buildMasteryHeatmap(weakTopics, strongTopics) {
  const heatmap = [];

  for (const st of strongTopics) {
    heatmap.push({
      topic: st.topic,
      mastery: st.mastery_score,
      status: st.mastery_score >= 0.8 ? 'strong' : 'moderate',
    });
  }

  for (const wt of weakTopics) {
    if (!heatmap.find(h => h.topic === wt.topic)) {
      heatmap.push({
        topic: wt.topic,
        mastery: 1 - wt.weakness_score,
        status: wt.weakness_score > 0.6 ? 'weak' : 'moderate',
      });
    }
  }

  return heatmap.sort((a, b) => b.mastery - a.mastery);
}

// ── Confidence Trend ─────────────────────────────────────────────────────────

function computeConfidenceTrend(memories) {
  const quizMemories = memories
    .filter(m => m.interaction_type === 'quiz')
    .slice(0, 10)
    .reverse();

  return quizMemories.map((m, i) => {
    try {
      const meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
      return { index: i + 1, score: meta?.score || 0, date: m.timestamp };
    } catch {
      return { index: i + 1, score: 0, date: m.timestamp };
    }
  });
}

// ── Risk Analysis ────────────────────────────────────────────────────────────

function analyzeRisk(weakTopics, memories, profile) {
  let riskScore = 0;
  const factors = [];

  // High weakness scores
  const severeWeakTopics = weakTopics.filter(t => t.weakness_score > 0.7);
  if (severeWeakTopics.length >= 3) {
    riskScore += 0.3;
    factors.push(`${severeWeakTopics.length} topics with weakness > 70%`);
  }

  // Low activity (less than 3 interactions in last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const recentActivity = memories.filter(m => m.timestamp > sevenDaysAgo).length;
  if (recentActivity < 3) {
    riskScore += 0.3;
    factors.push('Low study activity in last 7 days');
  }

  // Low confidence
  if ((profile?.confidence_score || 0.5) < 0.3) {
    riskScore += 0.2;
    factors.push('Low confidence score');
  }

  // Declining performance
  const quizScores = memories
    .filter(m => m.interaction_type === 'quiz')
    .slice(0, 5)
    .map(m => {
      try {
        const meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
        return meta?.score || 0;
      } catch { return 0; }
    });

  if (quizScores.length >= 3) {
    const recent = quizScores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const older = quizScores.slice(2).reduce((a, b) => a + b, 0) / (quizScores.length - 2);
    if (recent < older * 0.8) {
      riskScore += 0.2;
      factors.push('Declining quiz performance');
    }
  }

  const level = riskScore > 0.6 ? 'high' : riskScore > 0.3 ? 'medium' : 'low';

  return { score: Math.min(1, riskScore), level, factors };
}

// ── Learning Velocity ────────────────────────────────────────────────────────

function computeLearningVelocity(memories) {
  if (!memories.length) return { rate: 0, label: 'none' };

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const recent = memories.filter(m => m.timestamp > sevenDaysAgo).length;
  const rate = recent / 7;

  let label = 'slow';
  if (rate >= 5) label = 'fast';
  else if (rate >= 2) label = 'moderate';

  return { rate: Math.round(rate * 10) / 10, label };
}

// ── Retention Score ──────────────────────────────────────────────────────────

function computeRetentionScore(weakTopics, strongTopics) {
  const total = weakTopics.length + strongTopics.length;
  if (total === 0) return 0;
  return strongTopics.length / total;
}
