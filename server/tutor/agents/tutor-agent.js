// ═══════════════════════════════════════════════════════════════════════════════
// Tutor Agent — Core Teaching Agent
// Generates Socratic, emotion-aware, mode-specific responses using LLM.
// ═══════════════════════════════════════════════════════════════════════════════

import { getPromptForMode } from '../prompts/index.js';

// AI providers are injected from the main server
let _geminiModel = null;
let _groqClient = null;

export function setProviders({ geminiModel, groqClient }) {
  _geminiModel = geminiModel;
  _groqClient = groqClient;
}

export async function run(context) {
  const {
    message,
    mode = 'ask',
    studentState,
    emotion = 'neutral',
    ragContext = '',
    conversationHistory = [],
  } = context;

  // Build mode-specific prompt
  const prompt = getPromptForMode(mode, {
    message,
    studentState,
    emotion,
    ragContext,
    conversationHistory,
  });

  // Try LLM providers
  let rawResponse = null;
  let source = 'fallback';

  // Try Gemini first
  if (_geminiModel) {
    try {
      rawResponse = await runGemini(prompt);
      source = 'gemini';
    } catch (err) {
      console.error('[TutorAgent] Gemini error:', err.message?.slice(0, 100));
    }
  }

  // Try Groq fallback
  if (!rawResponse && _groqClient) {
    try {
      rawResponse = await runGroq(prompt);
      source = 'groq';
    } catch (err) {
      console.error('[TutorAgent] Groq error:', err.message?.slice(0, 100));
    }
  }

  // Parse LLM response
  if (rawResponse) {
    const parsed = parseResponse(rawResponse, emotion, mode);
    return { ...parsed, source };
  }

  // Final fallback
  return buildLocalTutorResponse({
    message,
    mode,
    emotion,
    studentState,
    ragContext,
  });
}

// ── LLM Runners ──────────────────────────────────────────────────────────────

async function runGemini(prompt) {
  if (!_geminiModel) throw new Error('Gemini not initialized');
  const result = await Promise.race([
    _geminiModel.generateContent(prompt),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini timeout')), 15000)),
  ]);
  const response = await result.response;
  return String(response?.text?.() || '').trim();
}

async function runGroq(prompt) {
  if (!_groqClient) throw new Error('Groq not initialized');
  const result = await Promise.race([
    _groqClient.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Groq timeout')), 12000)),
  ]);
  return String(result?.choices?.[0]?.message?.content || '').trim();
}

// ── Response Parsing ─────────────────────────────────────────────────────────

function parseResponse(raw, fallbackEmotion, mode) {
  const text = String(raw || '').trim();
  if (!text) return buildFallbackResponse('', mode, fallbackEmotion);

  // Try to extract JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const sanitized = jsonMatch[0].replace(/[\u0000-\u001F\u007F]/g, (ch) => {
      if (ch === '\n') return '\\n';
      if (ch === '\r') return '\\r';
      if (ch === '\t') return '\\t';
      return '';
    });

    try {
      const parsed = JSON.parse(sanitized);
      return {
        reply: parsed.reply || text,
        emotion: parsed.emotion || fallbackEmotion,
        topic: parsed.topic || '',
        followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions.slice(0, 3) : [],
        recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions.slice(0, 3) : [],
        interactiveBlocks: Array.isArray(parsed.interactiveBlocks) ? parsed.interactiveBlocks : [],
        difficulty: parsed.difficulty || 'medium',
        citations: Array.isArray(parsed.citations) ? parsed.citations : [],
        mode,
      };
    } catch {
      // Fall through
    }
  }

  // Plain text fallback
  return {
    reply: text.replace(/^```json\s*/i, '').replace(/```$/g, '').trim(),
    emotion: fallbackEmotion,
    topic: '',
    followUpQuestions: [],
    recommendedActions: [],
    interactiveBlocks: [],
    difficulty: 'medium',
    citations: [],
    mode,
  };
}

// ── Fallback ─────────────────────────────────────────────────────────────────

function buildLocalTutorResponse({ message, mode, emotion, studentState, ragContext }) {
  const weakTopic = studentState?.weakTopics?.[0]?.topic || '';
  const strongTopic = studentState?.strongTopics?.[0]?.topic || '';
  const subjectHint = weakTopic || strongTopic || inferTopicFromMessage(message);
  const contextSnippet = summarizeText(ragContext, 260);
  const messageHint = summarizeText(message, 140);

  const introByMode = {
    learn: 'Here is a guided explanation to get you moving.',
    practice: 'Let\'s turn this into practice and check your understanding.',
    revise: 'Let\'s quickly revise the key ideas and lock them in.',
    exam: 'Let\'s frame this like an exam question and work through it carefully.',
    ask: 'Let\'s break this down step by step.',
  };

  const explanationByMode = {
    learn: `Start with the core idea of ${subjectHint || messageHint}. If you already know part of it, tell me which part feels unclear and I\'ll narrow in on that first.`,
    practice: `Try answering one small part of ${subjectHint || messageHint} first. I\'ll then check your reasoning and give the next hint.`,
    revise: `Focus on the definition, one formula or rule, and one common mistake for ${subjectHint || messageHint}. That is usually enough for a fast revision pass.`,
    exam: `In exam mode, begin by identifying what is being asked, then write the known facts, then solve in a clean sequence.`,
    ask: `The fastest way to make progress here is to identify the topic, recall the known facts, and then solve one small step at a time.`,
  };

  const replyParts = [
    introByMode[mode] || introByMode.ask,
    explanationByMode[mode] || explanationByMode.ask,
  ];

  if (contextSnippet) {
    replyParts.push(`Using the available notes: ${contextSnippet}`);
  }

  replyParts.push('What part of this feels least clear right now?');

  return {
    reply: replyParts.join(' '),
    emotion: emotion || 'neutral',
    topic: subjectHint,
    followUpQuestions: buildFollowUpQuestions(mode, subjectHint),
    recommendedActions: buildRecommendedActions(mode, subjectHint),
    interactiveBlocks: [],
    difficulty: mode === 'exam' ? 'hard' : mode === 'practice' ? 'medium' : 'easy',
    citations: contextSnippet ? [{ source: 'Knowledge Base', page: null, chunk: contextSnippet }] : [],
    mode,
    source: 'local-fallback',
  };
}

function buildFollowUpQuestions(mode, topic) {
  const resolvedTopic = topic || 'this topic';
  if (mode === 'practice') {
    return [`Can you solve one step of ${resolvedTopic} first?`, `Which part of ${resolvedTopic} is confusing?`];
  }
  if (mode === 'revise') {
    return [`What is the one-line definition of ${resolvedTopic}?`, `Which formula or rule for ${resolvedTopic} do you want to revisit?`];
  }
  if (mode === 'exam') {
    return [`What is the question really asking in ${resolvedTopic}?`, `Which known facts can you write down first?`];
  }
  if (mode === 'learn') {
    return [`What do you already know about ${resolvedTopic}?`, `Would you like a simpler example first?`];
  }
  return [`What part of ${resolvedTopic} should we tackle first?`, `Would you like a hint or a full explanation?`];
}

function buildRecommendedActions(mode, topic) {
  const resolvedTopic = topic || 'the current topic';
  if (mode === 'practice') return [`Practice one question on ${resolvedTopic}`];
  if (mode === 'revise') return [`Make a short revision sheet for ${resolvedTopic}`];
  if (mode === 'exam') return [`Attempt one timed question on ${resolvedTopic}`];
  if (mode === 'learn') return [`Read the definition of ${resolvedTopic} once more`];
  return [`List the key facts for ${resolvedTopic}`];
}

function inferTopicFromMessage(message) {
  const text = String(message || '').toLowerCase();
  const topicMap = [
    ['photosynthesis', 'photosynthesis'],
    ['respiration', 'cell respiration'],
    ['electrostatics', 'electrostatics'],
    ['integration', 'integration'],
    ['derivative', 'differentiation'],
    ['organic', 'organic chemistry'],
    ['chemistry', 'chemistry'],
    ['physics', 'physics'],
    ['math', 'mathematics'],
    ['biology', 'biology'],
  ];

  for (const [needle, label] of topicMap) {
    if (text.includes(needle)) return label;
  }

  return String(message || '').trim().split(/\s+/).slice(0, 5).join(' ') || 'the topic';
}

function summarizeText(text, limit) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length > limit ? `${normalized.slice(0, limit - 1)}…` : normalized;
}
