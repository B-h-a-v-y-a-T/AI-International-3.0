"""
Decision Engine — Maps (mood, intent) → high-level tutor action.

Actions:
  - greet: friendly greeting response
  - deep_empathy: emotional support, acknowledgment, comfort
  - teach: step-by-step explanation, problem solving
  - guide: open-ended exploration, curiosity encouragement
  - fallback: safe default when context is unclear

This layer sits BETWEEN model outputs (sentiment/mood) and the bandit.
The bandit then selects VARIATIONS within the decided action.
"""

from typing import Dict, Any


# ── Primary Decision Matrix ───────────────────────────────────────────────────
# Maps (intent) → primary action, with mood-based adjustments

def decide_action(mood: str, intent: str) -> Dict[str, Any]:
    """
    Core decision function that determines the high-level tutor action.

    Args:
        mood: detected student mood ('stressed', 'confused', 'happy', 'focused')
        intent: detected intent ('casual', 'emotional_support', 'study_help', 'exploration')

    Returns:
        dict with:
            - action: str (the decided action)
            - priority: str ('emotion_first' or 'content_first')
            - allow_videos: bool (whether videos are appropriate)
            - response_depth: str ('brief', 'moderate', 'detailed')
    """

    # ── Intent is the primary driver ──────────────────────────────────────

    if intent == "casual":
        return {
            "action": "greet",
            "priority": "emotion_first",
            "allow_videos": False,
            "response_depth": "brief",
            "reasoning": f"Casual input detected. Mood: {mood}. Responding with friendly greeting."
        }

    if intent == "emotional_support":
        return {
            "action": "deep_empathy",
            "priority": "emotion_first",
            "allow_videos": False,
            "response_depth": "moderate",
            "reasoning": f"Emotional distress detected. Mood: {mood}. Prioritizing empathy over content."
        }

    if intent == "study_help":
        # Mood adjusts the teaching approach
        if mood == "stressed":
            return {
                "action": "teach",
                "priority": "emotion_first",
                "allow_videos": True,
                "response_depth": "moderate",
                "reasoning": f"Study help needed but student is stressed. Leading with encouragement, then teaching."
            }
        elif mood == "confused":
            return {
                "action": "teach",
                "priority": "content_first",
                "allow_videos": True,
                "response_depth": "detailed",
                "reasoning": f"Study help needed, student is confused. Providing detailed step-by-step explanation."
            }
        else:
            return {
                "action": "teach",
                "priority": "content_first",
                "allow_videos": True,
                "response_depth": "moderate",
                "reasoning": f"Study help needed, student mood is {mood}. Standard teaching mode."
            }

    if intent == "exploration":
        return {
            "action": "guide",
            "priority": "content_first",
            "allow_videos": False,
            "response_depth": "moderate",
            "reasoning": f"Exploration intent detected. Mood: {mood}. Guiding with open-ended questions."
        }

    # ── Fallback ──────────────────────────────────────────────────────────
    return {
        "action": "guide",
        "priority": "emotion_first",
        "allow_videos": False,
        "response_depth": "moderate",
        "reasoning": f"Fallback: unclear intent '{intent}' with mood '{mood}'."
    }


# ── Variation Pools ───────────────────────────────────────────────────────────
# These define the "arms" the bandit selects from WITHIN each decided action.

VARIATION_POOLS = {
    "greet": [
        "warm_greeting",       # "Hey! Great to see you 😊"
        "curious_greeting",    # "Hey! What's on your mind today?"
        "energetic_greeting",  # "Hey there! Ready to learn something awesome? 🚀"
    ],
    "deep_empathy": [
        "gentle_comfort",         # Soft, validating, calming
        "active_listening",       # Reflect back what they said, ask to elaborate
        "normalize_and_redirect", # Normalize the feeling, then gently suggest next step
    ],
    "teach": [
        "step_by_step",     # Break concept into numbered steps
        "analogy_based",    # Explain using real-world analogies
        "example_first",    # Start with a concrete example, then theory
    ],
    "guide": [
        "open_ended_question",  # Ask a thought-provoking question
        "topic_suggestion",     # Suggest an interesting related topic
        "curiosity_hook",       # Share a fascinating fact to spark interest
    ]
}


def get_variation_pool(action: str) -> list:
    """Returns the list of variation options for the bandit to choose from."""
    return VARIATION_POOLS.get(action, VARIATION_POOLS["guide"])


# Test when running directly
if __name__ == "__main__":
    tests = [
        ("focused", "casual"),
        ("stressed", "emotional_support"),
        ("confused", "study_help"),
        ("happy", "exploration"),
        ("stressed", "study_help"),
    ]
    for mood, intent in tests:
        result = decide_action(mood, intent)
        pool = get_variation_pool(result["action"])
        print(f"  ({mood}, {intent}) → {result['action']} | videos={result['allow_videos']} | variations={pool}")
