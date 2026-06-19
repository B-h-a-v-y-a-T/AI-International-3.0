"""
Intent Detector — Classifies student messages into intent categories.

Categories:
  - casual: greetings, small talk, very short messages
  - emotional_support: expressing frustration, sadness, stress, anxiety
  - study_help: asking to explain, solve, teach a concept
  - exploration: general curiosity, broad topic interest

This module does NOT modify any existing logic.
"""

from typing import Dict

# ── Keyword Banks ─────────────────────────────────────────────────────────────

GREETING_PHRASES = {
    "hi", "hello", "hey", "hii", "hiii", "yo", "sup", "hola",
    "good morning", "good afternoon", "good evening", "good night",
    "what's up", "whats up", "howdy", "namaste", "how are you",
    "how r u", "how are u", "wassup", "heya", "heyy", "hiya"
}

EMOTIONAL_KEYWORDS = [
    "frustrated", "frustrating", "can't do", "cant do", "give up",
    "i quit", "i can't", "i cant", "hate this", "stressed", "stress",
    "anxious", "anxiety", "worried", "nervous", "scared", "depressed",
    "sad", "upset", "crying", "cry", "hopeless", "worthless", "alone",
    "lonely", "tired", "exhausted", "burnout", "burnt out", "overwhelmed",
    "don't understand anything", "nothing makes sense", "i'm stupid",
    "im stupid", "i'm dumb", "im dumb", "i suck", "i failed",
    "scored low", "bad marks", "bad grade", "low marks", "low score",
    "feeling bad", "feeling down", "feeling terrible", "feeling awful",
    "what's the point", "whats the point", "no motivation", "no energy",
    "can't focus", "cant focus", "too much pressure", "i'm scared",
    "im scared", "help me i'm", "i don't know what to do"
]

STUDY_KEYWORDS = [
    "explain", "solve", "how to", "how do", "what is", "what are",
    "what does", "why does", "why is", "calculate", "derive", "proof",
    "prove", "formula", "equation", "theorem", "law of", "concept",
    "teach me", "show me", "help me understand", "help me with",
    "step by step", "steps to", "method for", "difference between",
    "define", "meaning of", "example of", "problem", "question",
    "practice", "exercise", "integration", "differentiation",
    "derivative", "integral", "reaction", "mechanism", "bond",
    "electron", "force", "velocity", "acceleration", "momentum",
    "energy", "work done", "circuit", "resistance", "current",
    "voltage", "mole", "molarity", "ph", "acid", "base",
    "periodic table", "cell division", "photosynthesis", "dna",
    "quadratic", "trigonometry", "probability", "permutation",
    "combination", "matrix", "vector", "logarithm"
]


def detect_intent(message: str) -> str:
    """
    Classifies the student's message into an intent category.

    Returns one of: 'casual', 'emotional_support', 'study_help', 'exploration'
    """
    text = message.strip().lower()
    words = text.split()

    # ── 1. Greeting hard override ─────────────────────────────────────────
    # Check if the entire message is a greeting phrase
    if text in GREETING_PHRASES:
        return "casual"

    # Check if starts with a greeting and is short (e.g. "hi there", "hello!")
    first_word = words[0].rstrip("!.,?") if words else ""
    if first_word in {"hi", "hello", "hey", "hii", "hiii", "yo", "sup",
                       "howdy", "namaste", "heya", "heyy", "hiya"} and len(words) <= 4:
        return "casual"

    # ── 2. Emotional support detection ────────────────────────────────────
    for keyword in EMOTIONAL_KEYWORDS:
        if keyword in text:
            return "emotional_support"

    # ── 3. Study help detection ───────────────────────────────────────────
    for keyword in STUDY_KEYWORDS:
        if keyword in text:
            return "study_help"

    # ── 4. Very short input → casual ──────────────────────────────────────
    if len(words) <= 3:
        return "casual"

    # ── 5. Default → exploration ──────────────────────────────────────────
    return "exploration"


def get_intent_metadata(intent: str) -> Dict[str, str]:
    """Returns human-readable metadata for an intent."""
    metadata = {
        "casual": {
            "label": "Casual / Greeting",
            "description": "Student is saying hi, chatting casually, or making small talk",
            "response_style": "friendly, warm, short"
        },
        "emotional_support": {
            "label": "Emotional Support",
            "description": "Student is expressing negative emotions and needs empathy",
            "response_style": "acknowledge → normalize → reflect → gentle follow-up"
        },
        "study_help": {
            "label": "Study Help",
            "description": "Student is asking for explanation, solution, or concept teaching",
            "response_style": "step-by-step, encourage thinking, guide with questions"
        },
        "exploration": {
            "label": "Exploration",
            "description": "Student is exploring a topic or expressing general curiosity",
            "response_style": "open-ended, curious, invite deeper thought"
        }
    }
    return metadata.get(intent, metadata["exploration"])


# Test when running directly
if __name__ == "__main__":
    tests = [
        "hi",
        "hello there",
        "I scored low in maths",
        "help me solve integration",
        "I'm really frustrated with physics",
        "Tell me about black holes",
        "what is Newton's third law",
        "I give up",
        "yo",
        "how are you",
    ]
    for t in tests:
        intent = detect_intent(t)
        meta = get_intent_metadata(intent)
        print(f"  '{t}' → {intent} ({meta['label']})")
