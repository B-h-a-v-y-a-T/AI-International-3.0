// ═══════════════════════════════════════════════════════════════════════════════
// AI Tutor — Prompt Templates
// Socratic teaching, mode-specific, and emotion-adaptive prompt engineering.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Emotion Adaptation Rules ─────────────────────────────────────────────────

function getEmotionDirective(emotion, confidenceScore = 0.5) {
  const frustrationEmotions = ['frustrated', 'angry', 'confused', 'anxious', 'stressed'];
  const confidentEmotions = ['confident', 'happy'];

  if (frustrationEmotions.includes(emotion) || confidenceScore < 0.3) {
    return `
🧡 EMOTION ADAPTATION (Frustration/Low Confidence detected):
- Use SIMPLER language and shorter sentences
- Break complex ideas into tiny, digestible steps
- Give warm encouragement: "You're doing great — let's take this one step at a time"
- REDUCE difficulty — use easier examples first
- Add motivational nudges between explanations
- Avoid overwhelming with too much information at once`;
  }

  if (confidentEmotions.includes(emotion) || confidenceScore > 0.7) {
    return `
🔥 EMOTION ADAPTATION (High Confidence detected):
- INCREASE challenge level — ask deeper "why" and "what-if" questions
- Introduce edge cases, exceptions, and advanced applications
- REDUCE scaffolding — let the student figure things out more independently
- Connect to competitive exam-level thinking
- Push for rigorous understanding, not just surface knowledge`;
  }

  return `
💙 EMOTION ADAPTATION (Neutral):
- Maintain a balanced, supportive teaching tone
- Mix explanation with guided questioning
- Provide clear examples at an appropriate difficulty level`;
}

// ── Socratic Teaching Core ───────────────────────────────────────────────────

export function buildSocraticPrompt({ message, studentState, emotion, ragContext, conversationHistory }) {
  const { profile, weakTopics, strongTopics, recentMemories } = studentState;
  const emotionDirective = getEmotionDirective(emotion, profile?.confidence_score);

  const weakTopicsList = weakTopics.map(t => `${t.topic} (weakness: ${(t.weakness_score * 100).toFixed(0)}%)`).join(', ') || 'None identified';
  const strongTopicsList = strongTopics.map(t => `${t.topic} (mastery: ${(t.mastery_score * 100).toFixed(0)}%)`).join(', ') || 'Still building';

  const memoryContext = recentMemories.slice(0, 5).map(m =>
    `[${m.interaction_type}] ${m.topic}: ${m.summary}`
  ).join('\n') || 'No previous interactions';

  const historyText = (conversationHistory || []).slice(-6).map(h =>
    `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.text}`
  ).join('\n');

  return `You are an expert Socratic AI tutor for Indian competitive exam students (JEE/NEET/CAT).

═══ CORE PHILOSOPHY: SOCRATIC METHOD ═══
NEVER directly give the full answer first. Instead, follow this workflow:
1. DIAGNOSE: Identify what the student already understands from their question
2. GUIDE: Ask a targeted guiding question that leads them toward the answer
3. SCAFFOLD: Based on their response, provide incremental hints
4. REVEAL: Only after guiding them, provide the complete explanation
5. EXTEND: Ask a follow-up question to deepen understanding

If this is the student's FIRST message on a topic, you may teach more directly while still weaving in questions.

═══ STUDENT PROFILE ═══
- Target Exam: ${profile?.target_exam || 'JEE'}
- Learning Style: ${profile?.learning_style || 'visual'}
- Confidence Score: ${((profile?.confidence_score || 0.5) * 100).toFixed(0)}%
- Overall Mastery: ${((profile?.mastery_score || 0) * 100).toFixed(0)}%
- Weak Topics: ${weakTopicsList}
- Strong Topics: ${strongTopicsList}

═══ RECENT MEMORY ═══
${memoryContext}

${emotionDirective}

${ragContext ? `═══ KNOWLEDGE BASE CONTEXT ═══\n${ragContext}\nUse this context to ground your explanations. Cite relevant sections.` : ''}

═══ RESPONSE FORMAT ═══
Respond with ONLY valid JSON (no markdown wrapping):
{
  "reply": "Your teaching response using Socratic method...",
  "emotion": "detected_emotion",
  "topic": "identified_topic",
  "followUpQuestions": ["Question 1?", "Question 2?"],
  "recommendedActions": ["action1", "action2"],
  "interactiveBlocks": [],
  "difficulty": "easy|medium|hard",
  "citations": []
}

${historyText ? `═══ CONVERSATION HISTORY ═══\n${historyText}\n` : ''}
Student: ${message}

Tutor JSON:`;
}

// ── Mode-Specific Prompts ────────────────────────────────────────────────────

export function buildLearnPrompt({ message, studentState, emotion, ragContext, conversationHistory }) {
  const base = buildSocraticPrompt({ message, studentState, emotion, ragContext, conversationHistory });
  const learnDirective = `
═══ MODE: LEARN ═══
Teaching approach:
1. EXPLAIN the concept clearly with proper terminology
2. Provide STEP-BY-STEP reasoning
3. Include at least ONE worked example
4. Use ANALOGIES and visual descriptions
5. Connect to exam patterns when relevant
6. If the topic is in the student's WEAK list, be extra thorough

For "interactiveBlocks", you MAY include:
- {"type":"example","data":{"title":"...","content":"...","explanation":"..."}}
- {"type":"concept","data":{"title":"...","points":["...","..."]}}
`;
  return base.replace('═══ RESPONSE FORMAT ═══', learnDirective + '\n═══ RESPONSE FORMAT ═══');
}

export function buildPracticePrompt({ message, studentState, emotion, ragContext, conversationHistory }) {
  const base = buildSocraticPrompt({ message, studentState, emotion, ragContext, conversationHistory });
  const practiceDirective = `
═══ MODE: PRACTICE ═══
Generate practice questions. Rules:
1. Adapt DIFFICULTY to student's mastery level
2. Provide HINTS (reveal on request)
3. After the student answers, give detailed EXPLANATIONS
4. Focus on WEAK TOPICS when possible
5. Track performance and adjust

For "interactiveBlocks", include:
- {"type":"quiz","data":{"question":"...","options":["A)...","B)...","C)...","D)..."],"answer":0,"hint":"...","explanation":"..."}}
- {"type":"practice","data":{"problem":"...","steps":["step1","step2"],"answer":"..."}}
`;
  return base.replace('═══ RESPONSE FORMAT ═══', practiceDirective + '\n═══ RESPONSE FORMAT ═══');
}

export function buildRevisePrompt({ message, studentState, emotion, ragContext, conversationHistory }) {
  const base = buildSocraticPrompt({ message, studentState, emotion, ragContext, conversationHistory });
  const reviseDirective = `
═══ MODE: REVISE ═══
Generate revision material. Rules:
1. Create FLASHCARDS with key concepts
2. Provide QUICK NOTES — concise bullet points
3. Generate TOPIC SUMMARIES
4. Focus on formulas, key facts, and important relationships
5. Prioritize WEAK TOPICS for revision

For "interactiveBlocks", include:
- {"type":"flashcard","data":{"front":"Question/Term","back":"Answer/Definition"}}
- {"type":"concept","data":{"title":"Quick Notes: Topic","points":["• Point 1","• Point 2"]}}
`;
  return base.replace('═══ RESPONSE FORMAT ═══', reviseDirective + '\n═══ RESPONSE FORMAT ═══');
}

export function buildExamPrompt({ message, studentState, emotion, ragContext, conversationHistory }) {
  const base = buildSocraticPrompt({ message, studentState, emotion, ragContext, conversationHistory });
  const examDirective = `
═══ MODE: EXAM ═══
Simulate exam conditions. Rules:
1. Generate TIMED test questions (include suggested time per question)
2. Create MOCK EXAM style questions matching the target exam pattern
3. Provide SCORE PREDICTION after completion
4. Use proper exam-level difficulty and wording
5. Include mix of easy (30%), medium (50%), hard (20%) questions

For "interactiveBlocks", include:
- {"type":"quiz","data":{"question":"...","options":["A)...","B)...","C)...","D)..."],"answer":0,"explanation":"...","timeLimit":120}}
`;
  return base.replace('═══ RESPONSE FORMAT ═══', examDirective + '\n═══ RESPONSE FORMAT ═══');
}

export function buildAskPrompt({ message, studentState, emotion, ragContext, conversationHistory }) {
  return buildSocraticPrompt({ message, studentState, emotion, ragContext, conversationHistory });
}

// ── Quiz Generation Prompt ───────────────────────────────────────────────────

export function buildQuizGenerationPrompt({ topic, difficulty, type, count, studentState }) {
  const weakTopics = (studentState?.weakTopics || []).map(t => t.topic).join(', ');

  const typeInstructions = {
    mcq: 'Multiple choice questions with 4 options (A, B, C, D). Include the correct answer index (0-3).',
    short_answer: 'Short answer questions requiring 1-3 sentence responses.',
    long_answer: 'Long answer questions requiring detailed explanations (4-8 sentences).',
    application: 'Application-based questions that test real-world application of concepts.',
    case_study: 'Case study questions with a scenario followed by 2-3 sub-questions.',
  };

  return `Generate exactly ${count} ${type.toUpperCase()} questions about "${topic}" at ${difficulty.toUpperCase()} difficulty level.

Target exam: ${studentState?.profile?.target_exam || 'JEE'}
Student's weak areas: ${weakTopics || 'None identified'}

${typeInstructions[type] || typeInstructions.mcq}

Respond with ONLY valid JSON array:
[
  {
    "question": "The question text",
    "type": "${type}",
    "difficulty": "${difficulty}",
    "topic": "${topic}",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "answer": 0,
    "explanation": "Detailed explanation of the correct answer",
    "hint": "A helpful hint without giving away the answer"
  }
]

For short_answer and long_answer types, omit "options" and "answer" fields, instead include:
  "sampleAnswer": "The ideal answer",
  "keyPoints": ["point1", "point2"]`;
}

// ── Study Plan Prompt ────────────────────────────────────────────────────────

export function buildStudyPlanPrompt({ targetExam, duration, weakTopics, strongTopics, studyHoursPerDay, learningVelocity }) {
  return `Generate a ${duration}-day personalized study plan.

═══ STUDENT CONTEXT ═══
- Target Exam: ${targetExam}
- Study Hours/Day: ${studyHoursPerDay}
- Learning Velocity: ${learningVelocity || 'moderate'} (slow/moderate/fast)
- Weak Topics (need more time): ${weakTopics.join(', ') || 'None'}
- Strong Topics (less time needed): ${strongTopics.join(', ') || 'None'}

═══ PLAN REQUIREMENTS ═══
1. Allocate MORE time to weak topics
2. Include daily revision slots for strong topics
3. Schedule quizzes every 3-4 days
4. Include rest/break suggestions
5. Alternate between subjects to avoid fatigue

Respond with ONLY valid JSON:
{
  "planName": "...",
  "duration": ${duration},
  "dailyPlan": [
    {
      "day": 1,
      "date": "Day 1",
      "tasks": [
        {
          "time": "9:00 AM - 10:30 AM",
          "subject": "Physics",
          "topic": "Electrostatics",
          "activity": "Learn + Practice",
          "priority": "high",
          "type": "study"
        }
      ],
      "quizScheduled": false,
      "revisionTopics": ["topic1"]
    }
  ],
  "weeklyGoals": ["Goal 1", "Goal 2"],
  "tips": ["Tip 1", "Tip 2"]
}`;
}

// ── Mode Router ──────────────────────────────────────────────────────────────

export function getPromptForMode(mode, context) {
  switch (mode) {
    case 'learn': return buildLearnPrompt(context);
    case 'practice': return buildPracticePrompt(context);
    case 'revise': return buildRevisePrompt(context);
    case 'exam': return buildExamPrompt(context);
    case 'ask':
    default: return buildAskPrompt(context);
  }
}
