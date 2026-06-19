from typing import List, Dict

MASCOT_MAPPING = {
    "stressed": "Take a deep breath, we’ll go step by step",
    "confused": "Let’s simplify this together",
    "happy": "You’re doing great, let’s go further",
    "focused": "Keep going, you’re on track"
}

def generate_action(mood: str, weak_concepts: List[str]) -> Dict[str, str]:
    """
    Tutor Rule-based Engine adapting teaching style per current behavioral limits.
    """
    decision = {
        "next_action": "",
        "difficulty": "",
        "mascot_message": MASCOT_MAPPING.get(mood, "Let's keep learning!"),
        "explanation": ""
    }
    
    # Evaluate what to explain based on the lowest point of the prerequisite chain
    # The last element in the weak_concept chain is usually the root prerequisite 
    root_weakness = weak_concepts[-1] if weak_concepts else "current topic"

    if mood == "stressed":
        decision["next_action"] = "suggest_easier_content"
        decision["difficulty"] = "easy"
        decision["explanation"] = f"Let's revise the basics of {root_weakness} first."
        
    elif mood == "confused":
        decision["next_action"] = "give_step_by_step"
        decision["difficulty"] = "medium"
        decision["explanation"] = f"Here is a step-by-step breakdown of {root_weakness}."
        
    elif mood == "happy":
        decision["next_action"] = "increase_difficulty"
        decision["difficulty"] = "hard"
        decision["explanation"] = f"Testing advanced concepts for {weak_concepts[0] if weak_concepts else 'math'}."
        
    else: # Focused
        decision["next_action"] = "continue_normal_flow"
        decision["difficulty"] = "medium"
        decision["explanation"] = "Continuing the standard curriculum track."

    return decision
