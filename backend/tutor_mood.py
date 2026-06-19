"""
Mood Detection Pipeline — Reliable, probability-aware mood classification.

Pipeline:
  Input → Short-text check → Greeting check → Sentiment model → 
  Confidence check → Uncertainty check → Performance merge → Final mood

Output format:
  { "mood": str, "confidence": float, "raw_label": str }
"""

from typing import Dict
from sentiment import analyze_sentiment

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

CONFIDENCE_THRESHOLD = 0.65   # Below this → mood defaults to "neutral"
UNCERTAINTY_GAP = 0.1         # If top-2 gap < this → model is uncertain → "neutral"
SHORT_TEXT_MAX_WORDS = 2      # Inputs with ≤ this many words are out-of-distribution

# Greeting phrases — these are NOT valid emotion inputs
GREETING_PHRASES = {
    "hi", "hello", "hey", "hii", "hiii", "yo", "sup", "hola",
    "howdy", "namaste", "heya", "heyy", "hiya", "what's up",
    "whats up", "good morning", "good afternoon", "good evening",
    "good night", "how are you", "how r u", "how are u", "wassup",
}

GREETING_WORDS = {
    "hi", "hello", "hey", "hii", "hiii", "yo", "sup",
    "howdy", "namaste", "heya", "heyy", "hiya"
}

# Generic short inputs that should not trigger emotions
NEUTRAL_SHORT_INPUTS = {
    "ok", "okay", "k", "fine", "alright", "sure", "yes", "no",
    "ya", "yep", "nah", "hmm", "hm", "umm", "um", "ah", "oh",
    "cool", "nice", "thanks", "thank you", "thx", "ty"
}


# ═══════════════════════════════════════════════════════════════════════════════
# PRE-PROCESSING CHECKS (before model is even called)
# ═══════════════════════════════════════════════════════════════════════════════

def _is_greeting(message: str) -> bool:
    """Check if the message is a greeting."""
    text = message.strip().lower().rstrip("!.,?")
    words = text.split()
    if text in GREETING_PHRASES:
        return True
    if words and words[0] in GREETING_WORDS and len(words) <= 3:
        return True
    return False


def _is_short_or_generic(message: str) -> bool:
    """Check if the message is too short or generic for reliable emotion detection."""
    text = message.strip().lower().rstrip("!.,?")
    words = text.split()
    # Very short input
    if len(words) <= SHORT_TEXT_MAX_WORDS:
        return True
    # Known generic short inputs
    if text in NEUTRAL_SHORT_INPUTS:
        return True
    return False


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN MOOD DETECTION PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def detect_mood(message: str, performance: Dict[str, float]) -> str:
    """
    Full mood detection pipeline with confidence and uncertainty awareness.

    Pipeline:
      1. Short-text check → neutral (out-of-distribution for the model)
      2. Greeting check → neutral (invalid emotion input)
      3. Sentiment model → softmax probabilities
      4. Confidence check → low confidence = neutral
      5. Uncertainty check → top-2 gap too small = neutral
      6. Performance merge → combine NLP signal with student metrics
      7. Return final mood

    Returns: one of 'neutral', 'stressed', 'confused', 'happy', 'focused'
    """
    result = detect_mood_detailed(message, performance)
    return result["mood"]


def detect_mood_detailed(message: str, performance: Dict[str, float]) -> Dict:
    """
    Full mood detection with detailed output including confidence and raw label.

    Returns:
        {
            "mood": str,          # final reliable mood
            "confidence": float,  # model confidence (0-1)
            "raw_label": str,     # original model prediction before overrides
            "reason": str         # why this mood was chosen
        }
    """
    # ── STEP 1: Short-text / generic input check ──────────────────────────
    if _is_short_or_generic(message):
        return {
            "mood": "neutral",
            "confidence": 0.0,
            "raw_label": "SKIPPED",
            "reason": "Short or generic input — out-of-distribution for emotion model"
        }

    # ── STEP 2: Greeting check ────────────────────────────────────────────
    if _is_greeting(message):
        return {
            "mood": "neutral",
            "confidence": 0.0,
            "raw_label": "SKIPPED",
            "reason": "Greeting detected — not a valid emotion input"
        }

    # ── STEP 3: Run sentiment model ───────────────────────────────────────
    sentiment = analyze_sentiment(message)
    raw_label = sentiment['label']           # 'POSITIVE' or 'NEGATIVE'
    confidence = sentiment['confidence']     # max probability
    top_gap = sentiment['top_gap']           # difference between top-1 and top-2

    # ── STEP 4: Confidence threshold check ────────────────────────────────
    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "mood": "neutral",
            "confidence": confidence,
            "raw_label": raw_label,
            "reason": f"Low confidence ({confidence:.3f} < {CONFIDENCE_THRESHOLD}) — defaulting to neutral"
        }

    # ── STEP 5: Uncertainty check (top-2 gap) ─────────────────────────────
    if top_gap < UNCERTAINTY_GAP:
        return {
            "mood": "neutral",
            "confidence": confidence,
            "raw_label": raw_label,
            "reason": f"High uncertainty (gap={top_gap:.3f} < {UNCERTAINTY_GAP}) — defaulting to neutral"
        }

    # ── STEP 6: Performance-aware mood mapping ────────────────────────────
    is_negative = (raw_label == 'NEGATIVE')

    if performance:
        avg_accuracy = sum(performance.values()) / len(performance)
    else:
        avg_accuracy = 100  # Default to good if no data

    # High-confidence negative → stressed
    if is_negative and confidence > 0.8:
        return {
            "mood": "stressed",
            "confidence": confidence,
            "raw_label": raw_label,
            "reason": f"High-confidence negative sentiment ({confidence:.3f})"
        }

    # Moderate negative + low performance → confused
    if is_negative and avg_accuracy < 50:
        return {
            "mood": "confused",
            "confidence": confidence,
            "raw_label": raw_label,
            "reason": f"Negative sentiment with low performance ({avg_accuracy:.0f}%)"
        }

    # Positive + good performance → happy
    if not is_negative and avg_accuracy > 80:
        return {
            "mood": "happy",
            "confidence": confidence,
            "raw_label": raw_label,
            "reason": f"Positive sentiment with good performance ({avg_accuracy:.0f}%)"
        }

    # ── STEP 7: Default → focused (neutral-positive baseline) ─────────────
    return {
        "mood": "focused",
        "confidence": confidence,
        "raw_label": raw_label,
        "reason": f"No strong signal — default to focused (conf={confidence:.3f}, perf={avg_accuracy:.0f}%)"
    }


# ═══════════════════════════════════════════════════════════════════════════════
# TEST
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    test_perf = {"Math": 0.6}

    tests = [
        "hi",
        "ok",
        "hello there",
        "I feel very stressed about exams",
        "this is amazing!",
        "I scored really low in maths",
        "help me solve integration",
        "I can't do this anymore",
        "sure",
        "Let's learn about physics",
    ]

    print("Mood Detection Pipeline Test")
    print("=" * 70)
    for t in tests:
        result = detect_mood_detailed(t, test_perf)
        print(f"  '{t}'")
        print(f"    → mood={result['mood']}, conf={result['confidence']:.3f}, raw={result['raw_label']}")
        print(f"    → reason: {result['reason']}")
        print()