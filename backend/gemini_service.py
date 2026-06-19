"""
Gemini Explanation Generator — Intent-aware LLM response layer.

Generates contextual, emotionally intelligent responses based on:
  - Student message
  - Detected mood
  - Detected intent (casual / emotional_support / study_help / exploration)
  - Decided action (greet / deep_empathy / teach / guide)
  - Bandit-selected variation (tone/style)

IMPORTANT: This module NEVER modifies bandit logic, rewards, or Q-values.
On any failure it returns empty strings so the original values are preserved.
"""

import os
import json
from typing import Dict, Any

# Try to load the Google Generative AI library
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

# Try loading dotenv for local development
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ── Initialise Gemini client ──────────────────────────────────────────────────
_model = None

def _get_model():
    """Lazy-init Groq API client."""
    global _model
    if _model is not None:
        return _model

    if not GROQ_AVAILABLE:
        return None

    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return None

    try:
        _model = Groq(api_key=api_key)
        return _model
    except Exception:
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# SENSITIVE TOPIC FILTER
# ═══════════════════════════════════════════════════════════════════════════════

SENSITIVE_KEYWORDS = [
    "gunpowder", "explosive", "bomb", "dynamite", "tnt", "grenade", "weapon",
    "missile", "bullet", "ammunition", "firearm", "gun", "pistol", "rifle",
    "make a bomb", "build a weapon", "how to kill", "how to hurt",
    "how to make drugs", "synthesize drugs", "meth", "heroin", "cocaine",
    "drug synthesis", "how to get high",
    "suicide", "self harm", "self-harm", "cut myself", "end my life",
    "kill myself", "kill someone", "murder", "how to poison",
    "hack into", "crack password", "ddos", "malware", "ransomware",
]

def _is_sensitive(message: str) -> bool:
    text = message.lower()
    return any(kw in text for kw in SENSITIVE_KEYWORDS)


# ═══════════════════════════════════════════════════════════════════════════════
# INTENT-AWARE PROMPT TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════

def _build_prompt(context: Dict[str, Any]) -> str:
    """Build a structured, intent-aware prompt for Gemini."""

    message = context.get("message", "")
    mood = context.get("mood", "focused")
    intent = context.get("intent", "exploration")
    decided_action = context.get("decided_action", "guide")
    variation = context.get("variation", "default")
    target_concept = context.get("target_concept", "the current topic")

    # ── Base system prompt ────────────────────────────────────────────────
    base = """You are an emotionally intelligent AI tutor named LearnBot for Indian students.

ABSOLUTE RULES:
- Prioritize understanding the student BEFORE solving problems
- Do NOT rush to give answers or explanations unless asked
- Do NOT recommend videos or resources unless the student is asking for study help
- Avoid robotic responses — be natural, warm, and human
- Keep responses concise (3-5 sentences max unless teaching)
- NEVER output JSON, markdown code blocks, or structured formats — write naturally

YOUTUBE VIDEO RULES:
- If mood is happy, neutral, focused, or any positive state: DO NOT provide any YouTube videos
- Only if mood is confused, stressed, low, or negative: You may provide up to 3 YouTube videos (optional, not mandatory)
- Maximum YouTube videos allowed in any response: 3
- STRICTLY ENFORCE: Never suggest more than 3 videos under any circumstances"""

    # ── Intent-specific behavioral rules ──────────────────────────────────

    if intent == "casual":
        behavior = f"""
INTENT: Casual / Greeting
BEHAVIOR:
- Respond with a short, friendly, natural greeting
- If they said "hi" or "hello", just greet them warmly
- Ask what they'd like to learn or how they're doing
- Keep it to 1-2 sentences maximum
- Do NOT bring up concepts, weak areas, or study topics
- Do NOT mention any academic content unprompted

Variation style: {variation}"""

    elif intent == "emotional_support":
        behavior = f"""
INTENT: Emotional Support
BEHAVIOR — Follow this EXACT sequence:
1. ACKNOWLEDGE the emotion they're expressing (name it back to them)
2. NORMALIZE it ("It's completely okay to feel this way", "Many students go through this")
3. REFLECT their situation with empathy (show you understand WHY they feel this way)
4. Ask a GENTLE follow-up question to understand more

CRITICAL RULES:
- Do NOT jump to solving problems or suggesting study plans
- Do NOT recommend videos or resources
- Do NOT say "let me teach you" or pivot to academics
- Stay with the emotion. Be present. Be human.
- If they mention low scores, focus on their FEELINGS about it, not the scores themselves

Variation style: {variation}
Student mood: {mood}"""

    elif intent == "study_help":
        behavior = f"""
INTENT: Study Help
BEHAVIOR:
- Provide a clear, educational response about {target_concept}
- Use the '{variation}' approach to teaching
- If 'step_by_step': break the concept into numbered steps
- If 'analogy_based': explain using real-world analogies the student can relate to
- If 'example_first': start with a concrete example, then explain the theory
- End with a guiding question to check understanding
- Be encouraging but focus on content

Student mood: {mood}
If mood is stressed: start with brief encouragement, then teach
If mood is confused: be extra patient and simple"""

    elif intent == "exploration":
        behavior = f"""
INTENT: Exploration
BEHAVIOR:
- The student is curious or exploring a topic
- Share something interesting about the topic
- Ask an open-ended question to deepen their thinking
- Spark curiosity without overwhelming
- Keep it conversational, like a mentor chatting
- Do NOT lecture — engage

Variation style: {variation}"""

    else:
        behavior = f"""
INTENT: General
BEHAVIOR:
- Respond naturally and helpfully
- Match the student's energy and mood ({mood})
- Keep it brief and friendly

Variation style: {variation}"""

    # ── Assemble the full prompt ──────────────────────────────────────────
    prompt = f"""{base}

{behavior}

---

Student said: "{message}"

Respond naturally as LearnBot. Do NOT use JSON. Just write your response directly."""

    return prompt


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

def generate_explanation(context: Dict[str, Any]) -> Dict[str, str]:
    """
    Generate an intent-aware response using Google Gemini.

    Args:
        context: dict with keys:
            - message: str
            - mood: str
            - intent: str (casual/emotional_support/study_help/exploration)
            - decided_action: str (greet/deep_empathy/teach/guide)
            - variation: str (bandit-selected tone/style)
            - target_concept: str
            - selected_action: str (original bandit action, for backward compat)

    Returns:
        dict with keys:
            - explanation: str (the full response text)
            - mascot_message: str (short encouraging line)

    On any failure, returns empty strings.
    """
    fallback = {"explanation": "", "mascot_message": ""}

    # Safety check — refuse sensitive/harmful topics
    if _is_sensitive(context.get("message", "")):
        refusal = "I\'m sorry, I can\'t help with that. I\'m here to support your learning journey — feel free to ask me about your studies, exams, or anything academic!"
        return {"explanation": refusal, "mascot_message": refusal}

    model = _get_model()
    if model is None:
        return fallback

    prompt = _build_prompt(context)

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Strip any accidental markdown fences
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines).strip()

        # The response is natural text, not JSON
        # Split into main explanation and a short mascot message
        sentences = text.replace("\n", " ").split(". ")
        if len(sentences) >= 2:
            mascot = sentences[0].strip() + "."
        else:
            mascot = text[:100].strip()

        return {
            "explanation": text,
            "mascot_message": mascot
        }
    except Exception as e:
        print(f"Gemini generation error: {e}")
        return fallback


# Quick test when running directly
if __name__ == "__main__":
    tests = [
        {
            "message": "hi",
            "mood": "focused",
            "intent": "casual",
            "decided_action": "greet",
            "variation": "warm_greeting",
            "target_concept": "general"
        },
        {
            "message": "I scored really low in maths and I feel terrible",
            "mood": "stressed",
            "intent": "emotional_support",
            "decided_action": "deep_empathy",
            "variation": "gentle_comfort",
            "target_concept": "math"
        },
        {
            "message": "help me solve integration by parts",
            "mood": "focused",
            "intent": "study_help",
            "decided_action": "teach",
            "variation": "step_by_step",
            "target_concept": "calculus"
        }
    ]
    for ctx in tests:
        print(f"\n--- {ctx['intent'].upper()} ---")
        result = generate_explanation(ctx)
        print(f"Response: {result['explanation'][:200]}...")
        print(f"Mascot: {result['mascot_message']}")
