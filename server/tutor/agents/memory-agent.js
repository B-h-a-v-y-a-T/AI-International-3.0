// ═══════════════════════════════════════════════════════════════════════════════
// Memory Agent
// Manages episodic memory — retrieves relevant past interactions, stores new ones.
// ═══════════════════════════════════════════════════════════════════════════════

import { addMemory, getMemories, getRecentTopics } from '../tutor-db.js';

export async function run(context) {
  const { userId, message, topic } = context;

  // Retrieve relevant memories
  const recentMemories = getMemories(userId, { limit: 10 });

  // Retrieve topic-specific memories if topic is identified
  let topicMemories = [];
  if (topic) {
    topicMemories = getMemories(userId, { limit: 5, topic });
  }

  // Get recent topics for continuity detection
  const recentTopics = getRecentTopics(userId, 10);

  // Detect if this is a continuation of a previous topic
  const isContinuation = recentTopics.length > 0 && topic && recentTopics[0] === topic;

  // Build memory context string for the tutor agent
  const memoryContext = buildMemoryContext(recentMemories, topicMemories, isContinuation);

  return {
    recentMemories,
    topicMemories,
    recentTopics,
    isContinuation,
    memoryContext,
  };
}

// Store a new interaction in memory
export async function store(userId, { interactionType, topic, summary, emotion, mode, metadata }) {
  addMemory(userId, {
    interactionType: interactionType || 'chat',
    topic: topic || '',
    summary: truncate(summary, 500),
    emotion: emotion || 'neutral',
    mode: mode || 'ask',
    metadata: metadata || {},
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildMemoryContext(recentMemories, topicMemories, isContinuation) {
  const parts = [];

  if (isContinuation && topicMemories.length > 0) {
    parts.push('📝 Previous discussion on this topic:');
    topicMemories.slice(0, 3).forEach(m => {
      parts.push(`  - [${m.interaction_type}] ${m.summary}`);
    });
  }

  if (recentMemories.length > 0) {
    parts.push('🕐 Recent interactions:');
    recentMemories.slice(0, 5).forEach(m => {
      parts.push(`  - [${m.interaction_type}/${m.mode}] ${m.topic || 'general'}: ${m.summary}`);
    });
  }

  return parts.join('\n') || 'No previous interactions found.';
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}
